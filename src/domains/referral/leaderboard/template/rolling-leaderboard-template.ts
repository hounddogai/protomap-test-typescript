/**
 * The rolling leaderboard template records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling leaderboard template is in its life cycle. */
export type RollingLeaderboardTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A rolling leaderboard template as the leaderboard team keeps it. */
export class RollingLeaderboardTemplate {
  code: string;
  label: string;
  utmSource: string;
  conversionRate: number;
  margin: number;
  contactEmail: string;
  country: string;
  budget: number;
  status: RollingLeaderboardTemplateStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    conversionRate: number,
    margin: number,
    contactEmail: string,
    country: string,
    budget: number,
    status: RollingLeaderboardTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.conversionRate = conversionRate;
    this.margin = margin;
    this.contactEmail = contactEmail;
    this.country = country;
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

  canMoveTo(next: RollingLeaderboardTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingLeaderboardTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling leaderboard template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"rolling leaderboard template"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.margin + this.conversionRate) * 100) / 100;
  }

  copy(): RollingLeaderboardTemplate {
    return new RollingLeaderboardTemplate(
      this.code,
      this.label,
      this.utmSource,
      this.conversionRate,
      this.margin,
      this.contactEmail,
      this.country,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a rolling leaderboard template in status open. */
export function newRollingLeaderboardTemplate(code: string, label: string): RollingLeaderboardTemplate {
  return new RollingLeaderboardTemplate(code, label, "", 0, 0, "", "", 0, "open");
}
