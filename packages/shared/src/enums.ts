export enum MissionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RESCHEDULED = 'rescheduled',
}

export enum ShiftStatus {
  PENDING = 'pending',
  READY = 'ready',
  ACTIVE = 'active',
  CLOSING = 'closing',
  CLOSED = 'closed',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  TRANSFER = 'transfer',
  CHECK = 'check',
}

export enum ReturnKind {
  RETURN = 'return',
  DAMAGED = 'damaged',
}

export enum UserRoleCode {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DISPATCHER = 'dispatcher',
  SUPERVISOR = 'supervisor',
  FINANCE = 'finance',
  DRIVER = 'driver',
}
