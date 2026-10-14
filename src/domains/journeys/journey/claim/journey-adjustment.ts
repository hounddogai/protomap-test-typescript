import * as text from "../../../../kit/text.js";

/** Where a journey adjustment is in its life cycle. */
export type JourneyAdjustmentStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A journey adjustment as the journey team keeps it. */
export class JourneyAdjustment {
  code: string;
  title: string;
  phone: string;
  threshold: number;
  startsAt: number;
  journeyId: string;
  ceiling: number;
  campaignRef: string;
  budget: number;
  status: JourneyAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    threshold: number,
    startsAt: number,
    journeyId: string,
    ceiling: number,
    campaignRef: string,
    budget: number,
    status: JourneyAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.threshold = threshold;
    this.startsAt = startsAt;
    this.journeyId = journeyId;
    this.ceiling = ceiling;
    this.campaignRef = campaignRef;
    this.budget = budget;
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

  canMoveTo(next: JourneyAdjustmentStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: JourneyAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"journey adjustment"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.startsAt * this.ceiling * 100) / 100;
  }

  copy(): JourneyAdjustment {
    return new JourneyAdjustment(
      this.code,
      this.title,
      this.phone,
      this.threshold,
      this.startsAt,
      this.journeyId,
      this.ceiling,
      this.campaignRef,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a journey adjustment in status proposed. */
export function newJourneyAdjustment(code: string, title: string): JourneyAdjustment {
  return new JourneyAdjustment(code, title, "", 0, 0, "", 0, "", 0, "proposed");
}
