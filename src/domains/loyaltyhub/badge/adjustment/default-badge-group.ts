import * as text from "../../../../kit/text.js";

/** Where a default badge group is in its life cycle. */
export type DefaultBadgeGroupStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A default badge group. Its code is unique within a tenant. */
export class DefaultBadgeGroup {
  code: string;
  label: string;
  clicks: number;
  amount: number;
  windowDays: number;
  score: number;
  contactEmail: string;
  expiresAt: number;
  cohort: string;
  status: DefaultBadgeGroupStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    amount: number,
    windowDays: number,
    score: number,
    contactEmail: string,
    expiresAt: number,
    cohort: string,
    status: DefaultBadgeGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.amount = amount;
    this.windowDays = windowDays;
    this.score = score;
    this.contactEmail = contactEmail;
    this.expiresAt = expiresAt;
    this.cohort = cohort;
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

  canMoveTo(next: DefaultBadgeGroupStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending" || next === "closed";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: DefaultBadgeGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default badge group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedTotal(): number {
    return Math.round((this.amount + this.expiresAt) * 100) / 100;
  }

  copy(): DefaultBadgeGroup {
    return new DefaultBadgeGroup(
      this.code,
      this.label,
      this.clicks,
      this.amount,
      this.windowDays,
      this.score,
      this.contactEmail,
      this.expiresAt,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a default badge group in status draft. */
export function newDefaultBadgeGroup(code: string, label: string): DefaultBadgeGroup {
  return new DefaultBadgeGroup(code, label, 0, 0, 0, 0, "", 0, "", "draft");
}
