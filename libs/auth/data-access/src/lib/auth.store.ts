import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Permission } from './permissions';
import type { User } from './user';

interface AuthState {
  readonly currentUser: User | null;
}

const initialState: AuthState = {
  currentUser: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => store.currentUser() !== null),
    permissions: computed<readonly Permission[]>(() => store.currentUser()?.permissions ?? []),
    supplierId: computed(() => store.currentUser()?.supplierId ?? null),
  })),
  withMethods((store) => ({
    signInAs(user: User): void {
      patchState(store, { currentUser: user });
    },
    signOut(): void {
      patchState(store, { currentUser: null });
    },
  })),
);
