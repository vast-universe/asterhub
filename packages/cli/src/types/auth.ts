/**
 * 认证相关类型
 */

// 用户信息
export interface UserInfo {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  namespaces: string[];
}

// 凭证
export interface Credentials {
  token: string;
  user: UserInfo;
  expiresAt?: string;
}

// 命名空间信息
export interface NamespaceInfo {
  name: string;
  description?: string;
  isDefault?: boolean;
  verified?: boolean;
  resourceCount?: number;
  createdAt?: string;
}
