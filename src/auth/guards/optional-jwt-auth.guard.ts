import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Sempre retorna true, permitindo que a requisição continue
    // independente de ter token ou não
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Se houver erro ou não houver usuário, simplesmente retorna undefined
    // ao invés de lançar exceção
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
