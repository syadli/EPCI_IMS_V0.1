import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    
    // In a real app, we would use bcrypt to compare hashed passwords.
    // For this prototype, we'll use a simple mock check or just assume success if email exists
    // (matches the current frontend logic).
    
    if (user) {
      const { ...result } = user;
      const payload = { sub: user.id, email: user.email, role: user.role, companyId: user.companyId };
      return {
        access_token: await this.jwtService.signAsync(payload),
        user: result,
      };
    }
    throw new UnauthorizedException();
  }
}
