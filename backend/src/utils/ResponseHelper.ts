import { Response, Request } from "express";
import { TFunction } from "i18next";

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export class ResponseHelper {
  /**
   * Send success response with translation
   */
  static success(
    res: Response,
    req: Request,
    messageKey: string,
    data?: any,
    statusCode: number = 200,
    interpolation?: any
  ): Response {
    const t = req.t || ((key: string) => key);
    const response: ApiResponse = {
      success: true,
      message: t(messageKey, interpolation),
      data,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response with translation
   */
  static error(
    res: Response,
    req: Request,
    messageKey: string,
    statusCode: number = 400,
    error?: any,
    interpolation?: any
  ): Response {
    const t = req.t || ((key: string) => key);
    const response: ApiResponse = {
      success: false,
      message: t(messageKey, interpolation),
      error: process.env.NODE_ENV === "development" ? error : undefined,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    req: Request,
    errors: any[],
    statusCode: number = 400
  ): Response {
    const t = req.t || ((key: string) => key);
    const response: ApiResponse = {
      success: false,
      message: t("general.validationError"),
      error: errors,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(
    res: Response,
    req: Request,
    messageKey: string = "general.unauthorized"
  ): Response {
    return this.error(res, req, messageKey, 401);
  }

  /**
   * Send forbidden response
   */
  static forbidden(
    res: Response,
    req: Request,
    messageKey: string = "general.forbidden"
  ): Response {
    return this.error(res, req, messageKey, 403);
  }

  /**
   * Send not found response
   */
  static notFound(
    res: Response,
    req: Request,
    messageKey: string = "general.notFound"
  ): Response {
    return this.error(res, req, messageKey, 404);
  }

  /**
   * Send server error response
   */ static serverError(
    res: Response,
    req: Request,
    error?: any,
    messageKey: string = "general.serverError"
  ): Response {
    return this.error(res, req, messageKey, 500, error);
  }
}

export default ResponseHelper;
