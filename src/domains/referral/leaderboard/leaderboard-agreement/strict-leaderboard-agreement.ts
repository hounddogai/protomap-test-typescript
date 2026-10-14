/**
 * The strict leaderboard agreement records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict leaderboard agreement is in its life cycle. */
export type StrictLeaderboardAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a strict leaderboard agreement and its current status. */
export class StrictLeaderboardAgreement {
  code: string;
  label: string;
  pinned: boolean;
  attributes: Map<string, string>;
  threshold: number;
  title: string;
  expiresAt: number;
  status: StrictLeaderboardAgreementStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    attributes: Map<string, string>,
    threshold: number,
    title: string,
    expiresAt: number,
    status: StrictLeaderboardAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.attributes = attributes;
    this.threshold = threshold;
    this.title = title;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: StrictLeaderboardAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictLeaderboardAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict leaderboard agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict leaderboard agreement"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.threshold - this.expiresAt) * 100) / 100;
  }

  copy(): StrictLeaderboardAgreement {
    return new StrictLeaderboardAgreement(
      this.code,
      this.label,
      this.pinned,
      this.attributes,
      this.threshold,
      this.title,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a strict leaderboard agreement in status open. */
export function newStrictLeaderboardAgreement(code: string, label: string): StrictLeaderboardAgreement {
  return new StrictLeaderboardAgreement(code, label, false, new Map<string, string>(), 0, "", 0, "open");
}
