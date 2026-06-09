export interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  totalVisitors: number;
  inBuildingVisitors: number;
  activePermissions: number;
  totalBookings: number;
  unhandledAlerts: number;
}

export interface RecentActivity {
  recentAppointments: Appointment[];
  recentVisitors: Visitor[];
  recentAlerts: Alert[];
}

export interface Appointment {
  id: number;
  visitorName: string;
  visitorCompany: string;
  visitorPhone: string;
  purpose: string;
  expectedTime: string;
  needMeetingRoom: boolean;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  employeeId: number;
  employeeName: string;
  visitorId: number | null;
  meetingRoomId: number | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentParams {
  visitorName: string;
  visitorCompany: string;
  visitorPhone: string;
  purpose: string;
  expectedTime: string;
  needMeetingRoom: boolean;
  remark?: string;
  employeeId: number;
  employeeName: string;
}

export interface Visitor {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  idNumber: string | null;
  idType: 'id_card' | 'passport' | 'driver_license' | 'other';
  photo: string | null;
  accompanyCount: number;
  appointmentId: number | null;
  status: 'pending' | 'registered' | 'in_building' | 'left' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface RegisterVisitorParams {
  name: string;
  company?: string;
  phone?: string;
  idType?: string;
  idNumber?: string;
  photo?: string;
  accompanyCount?: number;
  appointmentId?: number;
}

export interface AccessPermission {
  id: number;
  visitorId: number;
  companionId: number | null;
  visitorName: string;
  accompanyCount: number;
  allowedFloors: string;
  gateEnabled: boolean;
  validFrom: string;
  validUntil: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface CreateAccessPermissionParams {
  visitorId: number;
  visitorName: string;
  accompanyCount?: number;
  allowedFloors: string;
  gateEnabled?: boolean;
  validFrom: string;
  validUntil: string;
}

export interface AccessRecord {
  id: number;
  visitorId: number;
  visitorName: string;
  floor: string;
  gate: string;
  direction: 'in' | 'out';
  method: 'gate' | 'manual';
  timestamp: string;
}

export interface CreateAccessRecordParams {
  visitorId: number;
  visitorName: string;
  floor: string;
  gate: string;
  direction: 'in' | 'out';
  method: 'gate' | 'manual';
  timestamp?: string;
}

export interface MeetingRoom {
  id: number;
  name: string;
  floor: string;
  capacity: number;
  equipment: string | null;
  status: 'available' | 'occupied' | 'maintenance';
  createdAt: string;
}

export interface CreateMeetingRoomParams {
  name: string;
  floor: string;
  capacity: number;
  equipment?: string;
}

export interface MeetingBooking {
  id: number;
  meetingRoomId: number;
  visitorId: number;
  visitorName: string;
  appointmentId: number | null;
  startTime: string;
  endTime: string;
  teaService: boolean;
  equipmentNeeded: string | null;
  extended: boolean;
  originalEndTime: string | null;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface CreateMeetingBookingParams {
  meetingRoomId: number;
  visitorId: number;
  visitorName: string;
  appointmentId?: number;
  startTime: string;
  endTime: string;
  teaService?: boolean;
  equipmentNeeded?: string;
}

export interface ExtendBookingParams {
  newEndTime: string;
}

export interface Alert {
  id: number;
  type: 'id_mismatch' | 'temporary_visitor' | 'timeout' | 'meeting_conflict' | 'overstay' | 'companion_pending';
  severity: 'low' | 'medium' | 'high';
  visitorId: number | null;
  visitorName: string | null;
  message: string;
  handled: boolean;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
}

export interface Companion {
  id: number;
  name: string;
  idType: 'id_card' | 'passport' | 'driver_license' | 'other';
  idNumber: string | null;
  relationship: string;
  allowedFloors: string;
  visitorId: number;
  status: 'pending_confirmation' | 'confirmed' | 'rejected';
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterCompanionParams {
  name: string;
  idType?: string;
  idNumber?: string;
  relationship: string;
  allowedFloors?: string;
  visitorId: number;
}

export interface OverstayRecord {
  id: number;
  visitorId: number;
  visitorName: string;
  lastFloor: string | null;
  lastGate: string | null;
  lastAccessTime: string | null;
  result: 'normal_delay' | 'forgot_badge' | 'abnormal' | null;
  note: string | null;
  handledBy: string | null;
  handledAt: string | null;
  handled: boolean;
  createdAt: string;
}

export interface OverstayDetail {
  visitor: Visitor;
  lastAccessPoint: {
    floor: string;
    gate: string;
    time: string;
    direction: 'in' | 'out';
  } | null;
  permission: AccessPermission | null;
}

export interface HandleOverstayParams {
  result: 'normal_delay' | 'forgot_badge' | 'abnormal';
  note?: string;
  handledBy: string;
}
