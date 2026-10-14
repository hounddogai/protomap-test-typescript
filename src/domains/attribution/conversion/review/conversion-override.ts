import * as text from "../../../../kit/text.js";

/** Where a conversion override is in its life cycle. */
export type ConversionOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A conversion override as the conversion team keeps it. */
export class ConversionOverride {
  code: string;
  title: string;
  region: string;
  graceDays: number;
  conversionRate: number;
  discount: number;
  status: ConversionOverrideStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    graceDays: number,
    conversionRate: number,
    discount: number,
    status: ConversionOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.graceDays = graceDays;
    this.conversionRate = conversionRate;
    this.discount = discount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ConversionOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ConversionOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.conversionRate - this.discount) * 100) / 100;
  }

  copy(): ConversionOverride {
    return new ConversionOverride(
      this.code,
      this.title,
      this.region,
      this.graceDays,
      this.conversionRate,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a conversion override in status planned. */
export function newConversionOverride(code: string, title: string): ConversionOverride {
  return new ConversionOverride(code, title, "", 0, 0, 0, "planned");
}
