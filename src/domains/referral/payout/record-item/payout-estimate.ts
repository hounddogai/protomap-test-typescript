import * as text from "../../../../kit/text.js";

/** Where a payout estimate is in its life cycle. */
export type PayoutEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** A payout estimate as the payout team keeps it. */
export class PayoutEstimate {
  code: string;
  name: string;
  label: string;
  discount: number;
  rate: number;
  durationMinutes: number;
  ratio: number;
  margin: number;
  status: PayoutEstimateStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    discount: number,
    rate: number,
    durationMinutes: number,
    ratio: number,
    margin: number,
    status: PayoutEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.discount = discount;
    this.rate = rate;
    this.durationMinutes = durationMinutes;
    this.ratio = ratio;
    this.margin = margin;
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

  canMoveTo(next: PayoutEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PayoutEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round(this.margin * this.discount * 100) / 100;
  }

  copy(): PayoutEstimate {
    return new PayoutEstimate(
      this.code,
      this.name,
      this.label,
      this.discount,
      this.rate,
      this.durationMinutes,
      this.ratio,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a payout estimate in status requested. */
export function newPayoutEstimate(code: string, name: string): PayoutEstimate {
  return new PayoutEstimate(code, name, "", 0, 0, 0, 0, 0, "requested");
}
