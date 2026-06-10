/**
 * validate.ts — 请求验证中间件
 * 提供 URL 参数校验（UUID）和请求体验证工具函数。
 *
 * @author Huafeirong (https://github.com/huarongfei)
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// ==================== 类型 ====================

export interface ValidationRule {
  field: string;
  type?: 'string' | 'number' | 'boolean' | 'uuid' | 'enum';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  values?: string[]; // for enum
}

export interface ValidateBodyOptions {
  rules: ValidationRule[];
}

// ==================== 工具函数 ====================

/** 检查字符串是否为合法 UUID v4 格式 */
function isUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/** 验证单个字段 */
function validateField(value: unknown, rule: ValidationRule): string | null {
  // 必填检查
  if (value === undefined || value === null) {
    return rule.required ? `缺少必填字段: ${rule.field}` : null;
  }

  const strVal = String(value);

  // 类型检查
  switch (rule.type) {
    case 'uuid':
      if (!isUuid(strVal)) return `${rule.field} 不是有效的 UUID`;
      break;
    case 'enum':
      if (rule.values && !rule.values.includes(strVal)) {
        return `${rule.field} 必须是以下值之一: ${rule.values.join(', ')}`;
      }
      break;
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return `${rule.field} 必须是数字`;
      if (rule.min !== undefined && num < rule.min) return `${rule.field} 不能小于 ${rule.min}`;
      if (rule.max !== undefined && num > rule.max) return `${rule.field} 不能大于 ${rule.max}`;
      break;
    }
    case 'string':
    default:
      if (rule.minLength !== undefined && strVal.length < rule.minLength) {
        return `${rule.field} 长度不能小于 ${rule.minLength}`;
      }
      if (rule.maxLength !== undefined && strVal.length > rule.maxLength) {
        return `${rule.field} 长度不能大于 ${rule.maxLength}`;
      }
      break;
  }

  return null;
}

// ==================== 中间件 ====================

/**
 * 校验 URL 参数中的 UUID 字段（如 :id, :playerId）
 *
 * 用法:
 *   router.get('/:id', validateParamId('id'), handler)
 */
export function validateParamId(paramName: string = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    if (!value || Array.isArray(value) || !isUuid(String(value))) {
      next(AppError.badRequest('INVALID_PARAM', `参数 "${paramName}" 不是有效的 UUID`));
      return;
    }
    next();
  };
}

/**
 * 校验请求体 (req.body)
 *
 * 用法:
 *   router.post('/', validateBody({ rules: [...] }), handler)
 */
export function validateBody(options: ValidateBodyOptions) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of options.rules) {
      const error = validateField(req.body?.[rule.field], rule);
      if (error) errors.push(error);
    }

    if (errors.length > 0) {
      next(AppError.unprocessable('INVALID_INPUT', errors.join('; ')));
      return;
    }

    next();
  };
}
