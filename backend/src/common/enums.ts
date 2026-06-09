export enum VisitorStatus {
  PENDING = 'pending',
  REGISTERED = 'registered',
  IN_BUILDING = 'in_building',
  LEFT = 'left',
  REJECTED = 'rejected',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum AccessDirection {
  IN = 'in',
  OUT = 'out',
}

export enum AccessMethod {
  GATE = 'gate',
  MANUAL = 'manual',
}

export enum AccessPermissionStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
}

export enum MeetingRoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
}

export enum MeetingBookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum AlertType {
  ID_MISMATCH = 'id_mismatch',
  TEMPORARY_VISITOR = 'temporary_visitor',
  TIMEOUT = 'timeout',
  MEETING_CONFLICT = 'meeting_conflict',
  OVERSTAY = 'overstay',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum IdType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  OTHER = 'other',
}
