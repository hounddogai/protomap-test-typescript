import * as text from "../../../../kit/text.js";

/** Where a strict cohort profile is in its life cycle. */
export type StrictCohortProfileStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a strict cohort profile and its current status. */
export class StrictCohortProfile {
  code: string;
  name: string;
  timezone: string;
  updatedAt: number;
  channel: string;
  locale: string;
  variant: string;
  openRate: number;
  attempts: number;
  batchSize: number;
  score: number;
  status: StrictCohortProfileStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    updatedAt: number,
    channel: string,
    locale: string,
    variant: string,
    openRate: number,
    attempts: number,
    batchSize: number,
    score: number,
    status: StrictCohortProfileStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.updatedAt = updatedAt;
    this.channel = channel;
    this.locale = locale;
    this.variant = variant;
    this.openRate = openRate;
    this.attempts = attempts;
    this.batchSize = batchSize;
    this.score = score;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictCohortProfileStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictCohortProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict cohort profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  weightedExposure(): number {
    return Math.round((this.score + this.batchSize) * 100) / 100;
  }

  copy(): StrictCohortProfile {
    return new StrictCohortProfile(
      this.code,
      this.name,
      this.timezone,
      this.updatedAt,
      this.channel,
      this.locale,
      this.variant,
      this.openRate,
      this.attempts,
      this.batchSize,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a strict cohort profile in status draft. */
export function newStrictCohortProfile(code: string, name: string): StrictCohortProfile {
  return new StrictCohortProfile(code, name, "", 0, "", "", "", 0, 0, 0, 0, "draft");
}
