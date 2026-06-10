/**
 * AppError.test.ts
 * 测试自定义错误类。
 */
import { AppError } from './AppError';

describe('AppError', () => {
  it('应正确实例化', () => {
    const err = new AppError(400, 'TEST_CODE', '测试消息');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('TEST_CODE');
    expect(err.message).toBe('测试消息');
    expect(err instanceof Error).toBe(true);
  });

  it('badRequest 工厂方法应返回 400', () => {
    const err = AppError.badRequest('BAD', 'bad');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('BAD');
  });

  it('notFound 工厂方法应返回 404', () => {
    const err = AppError.notFound('NF', 'not found');
    expect(err.statusCode).toBe(404);
  });

  it('unprocessable 工厂方法应返回 422', () => {
    const err = AppError.unprocessable('INVALID', 'invalid input');
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('INVALID');
  });

  it('internal 工厂方法应返回 500', () => {
    const err = AppError.internal('INT', 'internal');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INT');
  });
});
