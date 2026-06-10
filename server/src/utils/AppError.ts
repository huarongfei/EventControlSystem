export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(code: string, message: string): AppError {
    return new AppError(400, code, message);
  }

  static notFound(code: string, message: string): AppError {
    return new AppError(404, code, message);
  }

  static unprocessable(code: string, message: string): AppError {
    return new AppError(422, code, message);
  }

  static internal(code: string, message: string): AppError {
    return new AppError(500, code, message);
  }
}
