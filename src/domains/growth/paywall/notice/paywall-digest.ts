import * as text from "../../../../kit/text.js";

/** Where a paywall digest is in its life cycle. */
export type PaywallDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One paywall digest, with what the planners need to act on it. */
export class PaywallDigest {
  code: string;
  label: string;
  discount: number;
  conversionRate: number;
  batchSize: number;
  variant: string;
  status: PaywallDigestStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    conversionRate: number,
    batchSize: number,
    variant: string,
    status: PaywallDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.conversionRate = conversionRate;
    this.batchSize = batchSize;
    this.variant = variant;
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

  canMoveTo(next: PaywallDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PaywallDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round(this.discount * this.batchSize * 100) / 100;
  }

  copy(): PaywallDigest {
    return new PaywallDigest(
      this.code,
      this.label,
      this.discount,
      this.conversionRate,
      this.batchSize,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a paywall digest in status proposed. */
export function newPaywallDigest(code: string, label: string): PaywallDigest {
  return new PaywallDigest(code, label, 0, 0, 0, "", "proposed");
}
