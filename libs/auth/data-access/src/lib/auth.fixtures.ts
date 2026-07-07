import { supplierId, userId } from '@scf/shared/kernel';
import type { User } from './user';

export const ACME_SUPPLIER: User = {
  id: userId('user-acme-1'),
  supplierId: supplierId('supplier-acme'),
  displayName: 'Alice from ACME',
  permissions: ['supplier:financing'],
};

export const BETA_SUPPLIER: User = {
  id: userId('user-beta-1'),
  supplierId: supplierId('supplier-beta'),
  displayName: 'Bob from BETA',
  permissions: [],
};
