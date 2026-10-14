import * as text from "../../../../kit/text.js";

/** Where a rolling conversion review is in its life cycle. */
export type RollingConversionReviewStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One rolling conversion review, with what the planners need to act on it. */
export class RollingConversionReview {
  code: string;
  title: string;
  variant: string;
  graceDays: number;
  cohort: string;
  impressions: number;
  revision: number;
  audienceId: string;
  status: RollingConversionReviewStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    graceDays: number,
    cohort: string,
    impressions: number,
    revision: number,
    audienceId: string,
    status: RollingConversionReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.graceDays = graceDays;
    this.cohort = cohort;
    this.impressions = impressions;
    this.revision = revision;
    this.audienceId = audienceId;
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

  canMoveTo(next: RollingConversionReviewStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: RollingConversionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling conversion review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netExposure(): number {
    return Math.round((this.impressions - this.revision) * 100) / 100;
  }

  copy(): RollingConversionReview {
    return new RollingConversionReview(
      this.code,
      this.title,
      this.variant,
      this.graceDays,
      this.cohort,
      this.impressions,
      this.revision,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a rolling conversion review in status planned. */
export function newRollingConversionReview(code: string, title: string): RollingConversionReview {
  return new RollingConversionReview(code, title, "", 0, "", 0, 0, "", "planned");
}
