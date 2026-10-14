import * as text from "../../../../kit/text.js";

/** Where a redemption tier is in its life cycle. */
export type RedemptionTierStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a redemption tier and its current status. */
export class RedemptionTier {
  code: string;
  label: string;
  phone: string;
  createdAt: number;
  quantity: number;
  sequence: number;
  visible: boolean;
  conversionRate: number;
  ceiling: number;
  windowDays: number;
  status: RedemptionTierStatus;

  constructor(
    code: string,
    label: string,
    phone: string,
    createdAt: number,
    quantity: number,
    sequence: number,
    visible: boolean,
    conversionRate: number,
    ceiling: number,
    windowDays: number,
    status: RedemptionTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.phone = phone;
    this.createdAt = createdAt;
    this.quantity = quantity;
    this.sequence = sequence;
    this.visible = visible;
    this.conversionRate = conversionRate;
    this.ceiling = ceiling;
    this.windowDays = windowDays;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionTierStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.quantity - this.ceiling) * 100) / 100;
  }

  copy(): RedemptionTier {
    return new RedemptionTier(
      this.code,
      this.label,
      this.phone,
      this.createdAt,
      this.quantity,
      this.sequence,
      this.visible,
      this.conversionRate,
      this.ceiling,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption tier in status requested. */
export function newRedemptionTier(code: string, label: string): RedemptionTier {
  return new RedemptionTier(code, label, "", 0, 0, 0, false, 0, 0, 0, "requested");
}
