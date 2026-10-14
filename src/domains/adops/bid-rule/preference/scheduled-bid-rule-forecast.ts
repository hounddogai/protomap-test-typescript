import * as text from "../../../../kit/text.js";

/** Where a scheduled bid rule forecast is in its life cycle. */
export type ScheduledBidRuleForecastStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A scheduled bid rule forecast. Its code is unique within a tenant. */
export class ScheduledBidRuleForecast {
  code: string;
  title: string;
  contactEmail: string;
  threshold: number;
  createdAt: number;
  ownerId: string;
  status: ScheduledBidRuleForecastStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    threshold: number,
    createdAt: number,
    ownerId: string,
    status: ScheduledBidRuleForecastStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
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

  canMoveTo(next: ScheduledBidRuleForecastStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledBidRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled bid rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled bid rule forecast"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round(this.threshold * this.createdAt * 100) / 100;
  }

  copy(): ScheduledBidRuleForecast {
    return new ScheduledBidRuleForecast(
      this.code,
      this.title,
      this.contactEmail,
      this.threshold,
      this.createdAt,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a scheduled bid rule forecast in status planned. */
export function newScheduledBidRuleForecast(code: string, title: string): ScheduledBidRuleForecast {
  return new ScheduledBidRuleForecast(code, title, "", 0, 0, "", "planned");
}
