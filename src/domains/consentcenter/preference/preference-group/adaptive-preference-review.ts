import * as text from "../../../../kit/text.js";

/** Where a adaptive preference review is in its life cycle. */
export type AdaptivePreferenceReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive preference review as the preference team keeps it. */
export class AdaptivePreferenceReview {
  code: string;
  title: string;
  channel: string;
  locale: string;
  maximum: number;
  graceDays: number;
  approved: boolean;
  status: AdaptivePreferenceReviewStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    locale: string,
    maximum: number,
    graceDays: number,
    approved: boolean,
    status: AdaptivePreferenceReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.locale = locale;
    this.maximum = maximum;
    this.graceDays = graceDays;
    this.approved = approved;
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

  canMoveTo(next: AdaptivePreferenceReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
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
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePreferenceReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive preference review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"adaptive preference review"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.graceDays - this.maximum) * 100) / 100;
  }

  copy(): AdaptivePreferenceReview {
    return new AdaptivePreferenceReview(
      this.code,
      this.title,
      this.channel,
      this.locale,
      this.maximum,
      this.graceDays,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a adaptive preference review in status planned. */
export function newAdaptivePreferenceReview(code: string, title: string): AdaptivePreferenceReview {
  return new AdaptivePreferenceReview(code, title, "", "", 0, 0, false, "planned");
}
