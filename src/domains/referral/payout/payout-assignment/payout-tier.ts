import * as text from "../../../../kit/text.js";

/** Where a payout tier is in its life cycle. */
export type PayoutTierStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One payout tier, with what the planners need to act on it. */
export class PayoutTier {
  code: string;
  label: string;
  batchSize: number;
  name: string;
  expiresAt: number;
  ratio: number;
  capacity: number;
  locale: string;
  updatedAt: number;
  campaignRef: string;
  status: PayoutTierStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    name: string,
    expiresAt: number,
    ratio: number,
    capacity: number,
    locale: string,
    updatedAt: number,
    campaignRef: string,
    status: PayoutTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.name = name;
    this.expiresAt = expiresAt;
    this.ratio = ratio;
    this.capacity = capacity;
    this.locale = locale;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: PayoutTierStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PayoutTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round(this.ratio * this.capacity * 100) / 100;
  }

  copy(): PayoutTier {
    return new PayoutTier(
      this.code,
      this.label,
      this.batchSize,
      this.name,
      this.expiresAt,
      this.ratio,
      this.capacity,
      this.locale,
      this.updatedAt,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout tier in status open. */
export function newPayoutTier(code: string, label: string): PayoutTier {
  return new PayoutTier(code, label, 0, "", 0, 0, 0, "", 0, "", "open");
}
