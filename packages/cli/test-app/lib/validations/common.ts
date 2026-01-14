/**
 * 通用 Schema
 */
import { z } from "zod";

export const emailSchema = z.string().email("请输入有效的邮箱地址");

export const passwordSchema = z.string().min(6, "密码至少 6 位");

export const requiredString = z.string().min(1, "此字段必填");

export const phoneSchema = z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号");

export const urlSchema = z.string().url("请输入有效的 URL");
