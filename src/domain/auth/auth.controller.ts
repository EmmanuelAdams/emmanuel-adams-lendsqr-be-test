import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../common/utils/async-handler';
import { SuccessResponse } from '../../common/api/response/success-response';
import { registerSchema } from '../user/dto/register.dto';
import { UserService } from '../user/user.service';
import { loginSchema } from './dto/login.dto';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(
    private readonly userService: UserService = new UserService(),
    private readonly authService: AuthService = new AuthService(),
  ) {}

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = registerSchema.parse(req.body);
    const result = await this.userService.register(dto);
    res
      .status(StatusCodes.CREATED)
      .json(new SuccessResponse(result, 'Account created successfully'));
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = loginSchema.parse(req.body);
    const result = await this.authService.login(dto);
    res.status(StatusCodes.OK).json(new SuccessResponse(result, 'Login successful'));
  });
}
