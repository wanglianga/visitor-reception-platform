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
  COMPANION_PENDING = 'companion_pending',
  SENSITIVE_ACCESS_VIOLATION = 'sensitive_access_violation',
  SENSITIVE_AREA_PENDING = 'sensitive_area_pending',
  MEETING_EXTENSION_REQUEST = 'meeting_extension_request',
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

export enum CompanionStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
}

export enum OverstayResult {
  NORMAL_DELAY = 'normal_delay',
  FORGOT_BADGE = 'forgot_badge',
  ABNORMAL = 'abnormal',
}

export enum SensitiveAreaType {
  R_AND_D = 'r_and_d',
  SERVER_ROOM = 'server_room',
  SAMPLE_ROOM = 'sample_room',
}

export enum SensitiveAreaApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum MeetingExtensionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
