import * as text from "../../../../kit/text.js";

/** Where a reply cycle is in its life cycle. */
export type ReplyCycleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A reply cycle as the reply team keeps it. */
export class ReplyCycle {
  code: string;
  name: string;
  locale: string;
  campaignRef: string;
  conversionRate: number;
  reviewer: string;
  discount: number;
  weight: number;
  endsAt: number;
  status: ReplyCycleStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    campaignRef: string,
    conversionRate: number,
    reviewer: string,
    discount: number,
    weight: number,
    endsAt: number,
    status: ReplyCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.conversionRate = conversionRate;
    this.reviewer = reviewer;
    this.discount = discount;
    this.weight = weight;
    this.endsAt = endsAt;
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

  canMoveTo(next: ReplyCycleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ReplyCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  effectiveLoad(): number {
    return Math.round((this.discount - this.conversionRate) * 100) / 100;
  }

  copy(): ReplyCycle {
    return new ReplyCycle(
      this.code,
      this.name,
      this.locale,
      this.campaignRef,
      this.conversionRate,
      this.reviewer,
      this.discount,
      this.weight,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a reply cycle in status open. */
export function newReplyCycle(code: string, name: string): ReplyCycle {
  return new ReplyCycle(code, name, "", "", 0, "", 0, 0, 0, "open");
}
