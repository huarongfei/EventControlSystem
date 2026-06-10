import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { checkRateLimit, checkConnectionLimit, onDisconnect } from './security';

// Mock Socket 对象
function createMockSocket(override?: Partial<any>): any {
  return {
    id: `socket-${Math.random().toString(36).slice(2)}`,
    handshake: { address: '127.0.0.1' },
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...override,
  };
}

describe('Socket Security Middleware', () => {
  beforeEach(() => {
    // 清理模块级 Map 状态
    // 由于 rateLimitMap 和 connectionCountMap 是模块级别的，
    // 我们需要通过测试间隔来避免状态泄漏
  });

  describe('checkConnectionLimit', () => {
    it('should allow connections below the limit', () => {
      const socket = createMockSocket();
      for (let i = 0; i < 5; i++) {
        expect(checkConnectionLimit(createMockSocket())).toBe(true);
      }
    });

    it('should reject connections exceeding per-IP limit (5)', () => {
      const socket = createMockSocket();
      // Allow first 5
      for (let i = 0; i < 5; i++) {
        checkConnectionLimit(createMockSocket());
      }
      // 6th should be rejected
      expect(checkConnectionLimit(createMockSocket())).toBe(false);
    });
  });

  describe('onDisconnect', () => {
    it('should decrement connection count on disconnect', () => {
      const socket = createMockSocket();
      // Create 3 connections from same IP
      checkConnectionLimit(socket);
      checkConnectionLimit(socket);
      checkConnectionLimit(socket);

      // Disconnect one
      onDisconnect(socket);

      // Should allow one more
      expect(checkConnectionLimit(createMockSocket())).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow events within rate limit window', () => {
      const socket = createMockSocket();
      for (let i = 0; i < 30; i++) {
        expect(checkRateLimit(socket)).toBe(true);
      }
    });

    it('should block events exceeding rate limit (30/10s)', () => {
      const socket = createMockSocket();
      // Exhaust limit
      for (let i = 0; i < 30; i++) {
        checkRateLimit(socket);
      }
      // 31st event should be blocked
      expect(checkRateLimit(socket)).toBe(false);
    });
  });
});
