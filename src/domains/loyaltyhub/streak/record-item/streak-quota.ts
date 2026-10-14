import * as text from "../../../../kit/text.js";

/** Where a streak quota is in its life cycle. */
export type StreakQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A streak quota. Its code is unique within a tenant. */
export class StreakQuota {
  code: string;
  label: string;
  margin: number;
  graceDays: number;
  contactEmail: string;
  startsAt: number;
  retries: number;
  sequence: number;
  archived: boolean;
  locale: string;
  impressions: number;
  status: StreakQuotaStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    graceDays: number,
    contactEmail: string,
    startsAt: number,
    retries: number,
    sequence: number,
    archived: boolean,
    locale: string,
    impressions: number,
    status: StreakQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.startsAt = startsAt;
    this.retries = retries;
    this.sequence = sequence;
    this.archived = archived;
    this.locale = locale;
    this.impressions = impressions;
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

  canMoveTo(next: StreakQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StreakQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedExposure(): number {
    return Math.round((this.retries + this.margin) * 100) / 100;
  }

  copy(): StreakQuota {
    return new StreakQuota(
      this.code,
      this.label,
      this.margin,
      this.graceDays,
      this.contactEmail,
      this.startsAt,
      this.retries,
      this.sequence,
      this.archived,
      this.locale,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a streak quota in status open. */
export function newStreakQuota(code: string, label: string): StreakQuota {
  return new StreakQuota(code, label, 0, 0, "", 0, 0, 0, false, "", 0, "open");
}
