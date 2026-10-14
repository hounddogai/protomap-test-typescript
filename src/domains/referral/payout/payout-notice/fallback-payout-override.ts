import * as text from "../../../../kit/text.js";

/** Where a fallback payout override is in its life cycle. */
export type FallbackPayoutOverrideStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A fallback payout override. Its code is unique within a tenant. */
export class FallbackPayoutOverride {
  code: string;
  name: string;
  quantity: number;
  variant: string;
  approved: boolean;
  phone: string;
  visible: boolean;
  discount: number;
  rate: number;
  status: FallbackPayoutOverrideStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    variant: string,
    approved: boolean,
    phone: string,
    visible: boolean,
    discount: number,
    rate: number,
    status: FallbackPayoutOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.variant = variant;
    this.approved = approved;
    this.phone = phone;
    this.visible = visible;
    this.discount = discount;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackPayoutOverrideStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPayoutOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback payout override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback payout override"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.discount - this.quantity) * 100) / 100;
  }

  copy(): FallbackPayoutOverride {
    return new FallbackPayoutOverride(
      this.code,
      this.name,
      this.quantity,
      this.variant,
      this.approved,
      this.phone,
      this.visible,
      this.discount,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback payout override in status proposed. */
export function newFallbackPayoutOverride(code: string, name: string): FallbackPayoutOverride {
  return new FallbackPayoutOverride(code, name, 0, "", false, "", false, 0, 0, "proposed");
}
