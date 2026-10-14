import * as text from "../../../../kit/text.js";

/** Where a default reward segment is in its life cycle. */
export type DefaultRewardSegmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default reward segment as the reward team keeps it. */
export class DefaultRewardSegment {
  code: string;
  title: string;
  locale: string;
  windowDays: number;
  country: string;
  maximum: number;
  amount: number;
  journeyId: string;
  variant: string;
  notes: string;
  status: DefaultRewardSegmentStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    windowDays: number,
    country: string,
    maximum: number,
    amount: number,
    journeyId: string,
    variant: string,
    notes: string,
    status: DefaultRewardSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.windowDays = windowDays;
    this.country = country;
    this.maximum = maximum;
    this.amount = amount;
    this.journeyId = journeyId;
    this.variant = variant;
    this.notes = notes;
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

  canMoveTo(next: DefaultRewardSegmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: DefaultRewardSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default reward segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netValue(): number {
    return Math.round(this.amount * this.windowDays * 100) / 100;
  }

  copy(): DefaultRewardSegment {
    return new DefaultRewardSegment(
      this.code,
      this.title,
      this.locale,
      this.windowDays,
      this.country,
      this.maximum,
      this.amount,
      this.journeyId,
      this.variant,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default reward segment in status proposed. */
export function newDefaultRewardSegment(code: string, title: string): DefaultRewardSegment {
  return new DefaultRewardSegment(code, title, "", 0, "", 0, 0, "", "", "", "proposed");
}
