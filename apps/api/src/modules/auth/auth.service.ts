import { authRules, defaultCategories } from "@accounting-app/shared";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { AppError } from "../../errors/AppError.js";
import type {
  AuthResult,
  LoginInput,
  PublicUser,
  RegisterInput,
} from "./auth.types.js";
import type { AuthRepository } from "./repositories/authRepository.js";

export interface AuthServiceOptions {
  jwtSecret: string;
  jwtExpiresIn: SignOptions["expiresIn"];
}

interface AuthTokenPayload {
  sub: string;
}

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly options: AuthServiceOptions,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    this.validateCredentials(input);

    const existingUser = await this.repository.findUserByUsername(
      input.username,
    );
    if (existingUser) {
      throw new AppError("用户名已存在", 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.repository.createUserWithDefaults({
      username: input.username,
      passwordHash,
      nickname: input.username,
      defaultBookName: "默认账本",
      categories: defaultCategories,
    });

    return {
      token: this.signToken(user.id),
      user,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    this.validateCredentials(input);

    const user = await this.repository.findUserByUsername(input.username);
    if (!user) {
      throw new AppError("用户名或密码错误", 401);
    }

    const isValidPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new AppError("用户名或密码错误", 401);
    }

    return {
      token: this.signToken(user.id),
      user: this.toPublicUser(user),
    };
  }

  async getUserFromToken(token: string): Promise<PublicUser> {
    try {
      const payload = jwt.verify(
        token,
        this.options.jwtSecret,
      ) as AuthTokenPayload;
      const user = await this.repository.findUserById(payload.sub);

      if (!user) {
        throw new AppError("登录状态已失效", 401);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("登录状态已失效", 401);
    }
  }

  private validateCredentials(input: RegisterInput | LoginInput) {
    if (
      input.username.length < authRules.minUsernameLength ||
      input.username.length > authRules.maxUsernameLength
    ) {
      throw new AppError("用户名长度必须为 3-20 位", 400);
    }

    if (input.password.length < authRules.minPasswordLength) {
      throw new AppError("密码至少 6 位", 400);
    }
  }

  private signToken(userId: string) {
    return jwt.sign({}, this.options.jwtSecret, {
      subject: userId,
      expiresIn: this.options.jwtExpiresIn,
    });
  }

  private toPublicUser(
    user: PublicUser & { passwordHash: string },
  ): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    void _passwordHash;
    return publicUser;
  }
}
