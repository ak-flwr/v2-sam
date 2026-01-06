export type Risk = "low" | "medium" | "high";
export type ShipmentStatus = "PENDING" | "OUT_FOR_DELIVERY" | "IN_TRANSIT" | "DELIVERED";

export type Shipment = {
  id: string;
  status: ShipmentStatus;
  risk: Risk;
  address: string;
  eta: string;
  updatedAt: string;
};

export type CustomerNote = {
  id: string;
  shipmentId: string;
  status: "RESOLVED" | "UNRESOLVED";
  title: string;
  body: string;
  createdAt: string;
};

export type LedgerEvent = {
  id: string;
  shipmentId: string;
  type: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type PolicyConfig = {
  rescheduleCutoffMin: number;
  maxMoveRadiusMeters: number;
  otpRequiredForSensitive: boolean;
  piiRedactionEnabled: boolean;
};
