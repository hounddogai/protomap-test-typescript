import * as text from "../../../../kit/text.js";

/** Where a adaptive invite summary is in its life cycle. */
export type AdaptiveInviteSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a adaptive invite summary and its current status. */
export class AdaptiveInviteSummary {
  code: string;
  title: string;
  journeyId: string;
  locale: string;
  frequencyCap: number;
  clicks: number;
  graceDays: number;
  createdAt: number;
  status: AdaptiveInviteSummaryStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    locale: string,
    frequencyCap: number,
    clicks: number,
    graceDays: number,
    createdAt: number,
    status: AdaptiveInviteSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.locale = locale;
    this.frequencyCap = frequencyCap;
    this.clicks = clicks;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
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

  canMoveTo(next: AdaptiveInviteSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
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

  moveTo(next: AdaptiveInviteSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive invite summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedLoad(): number {
    return Math.round((this.clicks - this.graceDays) * 100) / 100;
  }

  copy(): AdaptiveInviteSummary {
    return new AdaptiveInviteSummary(
      this.code,
      this.title,
      this.journeyId,
      this.locale,
      this.frequencyCap,
      this.clicks,
      this.graceDays,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive invite summary in status planned. */
export function newAdaptiveInviteSummary(code: string, title: string): AdaptiveInviteSummary {
  return new AdaptiveInviteSummary(code, title, "", "", 0, 0, 0, 0, "planned");
}
