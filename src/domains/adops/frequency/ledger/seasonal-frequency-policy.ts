import * as text from "../../../../kit/text.js";

/** Where a seasonal frequency policy is in its life cycle. */
export type SeasonalFrequencyPolicyStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal frequency policy. Its code is unique within a tenant. */
export class SeasonalFrequencyPolicy {
  code: string;
  label: string;
  active: boolean;
  threshold: number;
  quantity: number;
  locale: string;
  amount: number;
  rate: number;
  minimum: number;
  status: SeasonalFrequencyPolicyStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    threshold: number,
    quantity: number,
    locale: string,
    amount: number,
    rate: number,
    minimum: number,
    status: SeasonalFrequencyPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.threshold = threshold;
    this.quantity = quantity;
    this.locale = locale;
    this.amount = amount;
    this.rate = rate;
    this.minimum = minimum;
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

  canMoveTo(next: SeasonalFrequencyPolicyStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
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

  moveTo(next: SeasonalFrequencyPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal frequency policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round(this.threshold * this.amount * 100) / 100;
  }

  copy(): SeasonalFrequencyPolicy {
    return new SeasonalFrequencyPolicy(
      this.code,
      this.label,
      this.active,
      this.threshold,
      this.quantity,
      this.locale,
      this.amount,
      this.rate,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal frequency policy in status requested. */
export function newSeasonalFrequencyPolicy(code: string, label: string): SeasonalFrequencyPolicy {
  return new SeasonalFrequencyPolicy(code, label, false, 0, 0, "", 0, 0, 0, "requested");
}
