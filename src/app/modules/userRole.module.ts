import { Module } from '@nestjs/common';
import { UserRoleController } from '../controllers/be/v1/userRole.controller';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleRepository } from '../repositories/userRole.repository';
import { UserRoleService } from '../services/userRole.service';
import { UserRepository } from '../repositories/user.repository';
@Module({
  controllers: [UserRoleController],
  providers: [
    UserRoleRepository,
    UserRoleService,
    RoleRepository,
    UserRepository,
  ],
  exports: [UserRoleRepository, UserRoleService],
})
export class UserRoleModule {}
