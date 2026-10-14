import * as text from "../../../../kit/text.js";

/** Where a badge tier is in its life cycle. */
export type BadgeTierStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a badge tier and its current status. */
export class BadgeTier {
  code: string;
  label: string;
  locale: string;
  approved: boolean;
  ratio: number;
  expiresAt: number;
  timezone: string;
  rate: number;
  retries: number;
  updatedAt: number;
  status: BadgeTierStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    approved: boolean,
    ratio: number,
    expiresAt: number,
    timezone: string,
    rate: number,
    retries: number,
    updatedAt: number,
    status: BadgeTierStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.approved = approved;
    this.ratio = ratio;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.rate = rate;
    this.retries = retries;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: BadgeTierStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BadgeTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round((this.rate + this.expiresAt) * 100) / 100;
  }

  copy(): BadgeTier {
    return new BadgeTier(
      this.code,
      this.label,
      this.locale,
      this.approved,
      this.ratio,
      this.expiresAt,
      this.timezone,
      this.rate,
      this.retries,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a badge tier in status planned. */
export function newBadgeTier(code: string, label: string): BadgeTier {
  return new BadgeTier(code, label, "", false, 0, 0, "", 0, 0, 0, "planned");
}
