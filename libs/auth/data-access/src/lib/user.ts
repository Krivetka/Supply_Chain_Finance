import type { SupplierId, UserId } from '@scf/shared/kernel';
import type { Permission } from './permissions';

export interface User {
  readonly id: UserId;
  readonly supplierId: SupplierId;
  readonly displayName: string;
  readonly permissions: readonly Permission[];
}
