import * as text from "../../../../kit/text.js";

/** Where a fraud check window is in its life cycle. */
export type FraudCheckWindowStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A fraud check window as the fraud check team keeps it. */
export class FraudCheckWindow {
  code: string;
  name: string;
  quantity: number;
  updatedAt: number;
  priority: number;
  campaignRef: string;
  conversionRate: number;
  maximum: number;
  ratio: number;
  phone: string;
  status: FraudCheckWindowStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    updatedAt: number,
    priority: number,
    campaignRef: string,
    conversionRate: number,
    maximum: number,
    ratio: number,
    phone: string,
    status: FraudCheckWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.maximum = maximum;
    this.ratio = ratio;
    this.phone = phone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckWindowStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: FraudCheckWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fraud check window"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.ratio + this.quantity) * 100) / 100;
  }

  copy(): FraudCheckWindow {
    return new FraudCheckWindow(
      this.code,
      this.name,
      this.quantity,
      this.updatedAt,
      this.priority,
      this.campaignRef,
      this.conversionRate,
      this.maximum,
      this.ratio,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fraud check window in status draft. */
export function newFraudCheckWindow(code: string, name: string): FraudCheckWindow {
  return new FraudCheckWindow(code, name, 0, 0, 0, "", 0, 0, 0, "", "draft");
}
