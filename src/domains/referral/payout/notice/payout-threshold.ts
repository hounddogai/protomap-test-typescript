import * as text from "../../../../kit/text.js";

/** Where a payout threshold is in its life cycle. */
export type PayoutThresholdStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One payout threshold, with what the planners need to act on it. */
export class PayoutThreshold {
  code: string;
  title: string;
  version: number;
  name: string;
  rate: number;
  locale: string;
  discount: number;
  ratio: number;
  status: PayoutThresholdStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    name: string,
    rate: number,
    locale: string,
    discount: number,
    ratio: number,
    status: PayoutThresholdStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.name = name;
    this.rate = rate;
    this.locale = locale;
    this.discount = discount;
    this.ratio = ratio;
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

  canMoveTo(next: PayoutThresholdStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PayoutThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`payout threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"payout threshold"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.ratio - this.rate) * 100) / 100;
  }

  copy(): PayoutThreshold {
    return new PayoutThreshold(
      this.code,
      this.title,
      this.version,
      this.name,
      this.rate,
      this.locale,
      this.discount,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a payout threshold in status open. */
export function newPayoutThreshold(code: string, title: string): PayoutThreshold {
  return new PayoutThreshold(code, title, 0, "", 0, "", 0, 0, "open");
}
