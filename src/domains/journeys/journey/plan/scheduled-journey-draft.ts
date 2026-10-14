import * as text from "../../../../kit/text.js";

/** Where a scheduled journey draft is in its life cycle. */
export type ScheduledJourneyDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One scheduled journey draft, with what the planners need to act on it. */
export class ScheduledJourneyDraft {
  code: string;
  title: string;
  region: string;
  conversionRate: number;
  budget: number;
  status: ScheduledJourneyDraftStatus;

  constructor(
    code: string,
    title: string,
    region: string,
    conversionRate: number,
    budget: number,
    status: ScheduledJourneyDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.region = region;
    this.conversionRate = conversionRate;
    this.budget = budget;
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

  canMoveTo(next: ScheduledJourneyDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ScheduledJourneyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled journey draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.budget * this.conversionRate * 100) / 100;
  }

  copy(): ScheduledJourneyDraft {
    return new ScheduledJourneyDraft(this.code, this.title, this.region, this.conversionRate, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a scheduled journey draft in status open. */
export function newScheduledJourneyDraft(code: string, title: string): ScheduledJourneyDraft {
  return new ScheduledJourneyDraft(code, title, "", 0, 0, "open");
}
