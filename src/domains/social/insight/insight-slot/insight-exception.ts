import * as text from "../../../../kit/text.js";

/** Where a insight exception is in its life cycle. */
export type InsightExceptionStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A insight exception as the insight team keeps it. */
export class InsightException {
  code: string;
  name: string;
  currency: string;
  channel: string;
  discount: number;
  score: number;
  status: InsightExceptionStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    channel: string,
    discount: number,
    score: number,
    status: InsightExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.channel = channel;
    this.discount = discount;
    this.score = score;
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

  canMoveTo(next: InsightExceptionStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: InsightExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveVolume(): number {
    return Math.round((this.score - this.discount) * 100) / 100;
  }

  copy(): InsightException {
    return new InsightException(
      this.code,
      this.name,
      this.currency,
      this.channel,
      this.discount,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a insight exception in status proposed. */
export function newInsightException(code: string, name: string): InsightException {
  return new InsightException(code, name, "", "", 0, 0, "proposed");
}
