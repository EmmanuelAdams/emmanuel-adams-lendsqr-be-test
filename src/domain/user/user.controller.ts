import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../../common/utils/async-handler';
import { SuccessResponse } from '../../common/api/response/success-response';
import { registerSchema } from './dto/register.dto';
import { UserService } from './user.service';

export class UserController {
  constructor(private readonly userService: UserService = new UserService()) {}

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = registerSchema.parse(req.body);
    const result = await this.userService.register(dto);
    res
      .status(StatusCodes.CREATED)
      .json(new SuccessResponse(result, 'Account created successfully'));
  });
}
