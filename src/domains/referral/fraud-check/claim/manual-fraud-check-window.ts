import * as text from "../../../../kit/text.js";

/** Where a manual fraud check window is in its life cycle. */
export type ManualFraudCheckWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual fraud check window as the fraud check team keeps it. */
export class ManualFraudCheckWindow {
  code: string;
  label: string;
  phone: string;
  capacity: number;
  updatedAt: number;
  description: string;
  cost: number;
  bid: number;
  status: ManualFraudCheckWindowStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    capacity: number,
    updatedAt: number,
    description: string,
    cost: number,
    bid: number,
    status: ManualFraudCheckWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.capacity = capacity;
    this.updatedAt = updatedAt;
    this.description = description;
    this.cost = cost;
    this.bid = bid;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualFraudCheckWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualFraudCheckWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual fraud check window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round(this.bid * this.capacity * 100) / 100;
  }

  copy(): ManualFraudCheckWindow {
    return new ManualFraudCheckWindow(
      this.code,
      this.label,
      this.phone,
      this.capacity,
      this.updatedAt,
      this.description,
      this.cost,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual fraud check window in status planned. */
export function newManualFraudCheckWindow(code: string, label: string): ManualFraudCheckWindow {
  return new ManualFraudCheckWindow(code, label, "", 0, 0, "", 0, 0, "planned");
}
