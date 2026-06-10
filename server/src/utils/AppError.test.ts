/**
 * AppError.test.ts
 * 测试自定义错误类。
 */
import { AppError, errorHandler } from '../src/utils/AppError';
import { Request, Response, NextFunction } from 'express';

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

  it('internal 工厂方法应返回 500', () => {
    const err = AppError.internal('INT', 'internal');
    expect(err.statusCode).toBe(500);
  });
});

describe('errorHandler', () => {
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
    };
  });

  it('应处理 AppError — 返回对应 statusCode 和 JSON', () => {
    const err = AppError.badRequest('BAD', 'bad request');
    errorHandler(err, {} as Request, mockRes as Response, jest.fn());

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'BAD',
      message: 'bad request',
    });
  });

  it('应处理非 AppError — 返回 500', () => {
    const err = new Error('unexpected');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    errorHandler(err, {} as Request, mockRes as Response, jest.fn());

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    });
    consoleSpy.mockRestore();
  });
});
