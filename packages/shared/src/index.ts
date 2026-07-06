export type BillType = "expense" | "income";

export interface DefaultCategory {
  readonly type: BillType;
  readonly name: string;
  readonly icon: string;
  readonly sort: number;
}

const expenseNames = [
  "餐饮",
  "购物",
  "日用",
  "交通",
  "蔬菜",
  "水果",
  "零食",
  "运动",
  "娱乐",
  "通讯",
  "服饰",
  "美容",
  "住房",
  "居家",
  "孩子",
  "长辈",
  "社交",
  "旅行",
  "烟酒",
  "数码",
  "汽车",
  "医疗",
  "书籍",
  "学习",
  "宠物",
  "礼金",
  "礼物",
  "办公",
  "维修",
  "捐赠",
  "彩票",
  "亲友",
] as const;

const incomeNames = [
  "工资",
  "奖金",
  "兼职",
  "理财",
  "礼金",
  "报销",
  "退款",
  "其他",
] as const;

export const defaultCategories: readonly DefaultCategory[] = [
  ...expenseNames.map((name, index) => ({
    type: "expense" as const,
    name,
    icon: `expense-${index + 1}`,
    sort: index + 1,
  })),
  ...incomeNames.map((name, index) => ({
    type: "income" as const,
    name,
    icon: `income-${index + 1}`,
    sort: index + 1,
  })),
];

export const imageUploadRules = {
  maxFiles: 1,
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  extensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
};

export const authRules = {
  minUsernameLength: 3,
  maxUsernameLength: 20,
  minPasswordLength: 6,
};
