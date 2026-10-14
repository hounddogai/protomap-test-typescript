import * as text from "../../../../kit/text.js";

/** Where a paywall variance is in its life cycle. */
export type PaywallVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One paywall variance, with what the planners need to act on it. */
export class PaywallVariance {
  code: string;
  label: string;
  batchSize: number;
  locale: string;
  conversionRate: number;
  capacity: number;
  status: PaywallVarianceStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    locale: string,
    conversionRate: number,
    capacity: number,
    status: PaywallVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.capacity = capacity;
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

  canMoveTo(next: PaywallVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PaywallVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"paywall variance"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.batchSize * this.capacity * 100) / 100;
  }

  copy(): PaywallVariance {
    return new PaywallVariance(
      this.code,
      this.label,
      this.batchSize,
      this.locale,
      this.conversionRate,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a paywall variance in status draft. */
export function newPaywallVariance(code: string, label: string): PaywallVariance {
  return new PaywallVariance(code, label, 0, "", 0, 0, "draft");
}
