import * as text from "../../../../kit/text.js";

/** Where a primary badge baseline is in its life cycle. */
export type PrimaryBadgeBaselineStatus = "created" | "validated" | "published" | "retired";

/** One primary badge baseline, with what the planners need to act on it. */
export class PrimaryBadgeBaseline {
  code: string;
  name: string;
  threshold: number;
  maximum: number;
  ratio: number;
  phone: string;
  conversionRate: number;
  rate: number;
  status: PrimaryBadgeBaselineStatus;

  constructor(
    code: string,
    name: string,
    threshold: number,
    maximum: number,
    ratio: number,
    phone: string,
    conversionRate: number,
    rate: number,
    status: PrimaryBadgeBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.threshold = threshold;
    this.maximum = maximum;
    this.ratio = ratio;
    this.phone = phone;
    this.conversionRate = conversionRate;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryBadgeBaselineStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        return next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryBadgeBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary badge baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  adjustedTotal(): number {
    return Math.round(this.maximum * this.ratio * 100) / 100;
  }

  copy(): PrimaryBadgeBaseline {
    return new PrimaryBadgeBaseline(
      this.code,
      this.name,
      this.threshold,
      this.maximum,
      this.ratio,
      this.phone,
      this.conversionRate,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary badge baseline in status created. */
export function newPrimaryBadgeBaseline(code: string, name: string): PrimaryBadgeBaseline {
  return new PrimaryBadgeBaseline(code, name, 0, 0, 0, "", 0, 0, "created");
}
