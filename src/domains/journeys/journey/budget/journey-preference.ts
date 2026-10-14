import * as text from "../../../../kit/text.js";

/** Where a journey preference is in its life cycle. */
export type JourneyPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One journey preference, with what the planners need to act on it. */
export class JourneyPreference {
  code: string;
  title: string;
  clicks: number;
  createdAt: number;
  amount: number;
  attempts: number;
  region: string;
  variant: string;
  revision: number;
  limit: number;
  status: JourneyPreferenceStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    createdAt: number,
    amount: number,
    attempts: number,
    region: string,
    variant: string,
    revision: number,
    limit: number,
    status: JourneyPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.createdAt = createdAt;
    this.amount = amount;
    this.attempts = attempts;
    this.region = region;
    this.variant = variant;
    this.revision = revision;
    this.limit = limit;
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

  canMoveTo(next: JourneyPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: JourneyPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.limit + this.createdAt) * 100) / 100;
  }

  copy(): JourneyPreference {
    return new JourneyPreference(
      this.code,
      this.title,
      this.clicks,
      this.createdAt,
      this.amount,
      this.attempts,
      this.region,
      this.variant,
      this.revision,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a journey preference in status open. */
export function newJourneyPreference(code: string, title: string): JourneyPreference {
  return new JourneyPreference(code, title, 0, 0, 0, 0, "", "", 0, 0, "open");
}
