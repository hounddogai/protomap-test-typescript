/**
 * The tiered leaderboard template records of referral's leaderboard work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered leaderboard template is in its life cycle. */
export type TieredLeaderboardTemplateStatus = "created" | "validated" | "published" | "retired";

/** A tiered leaderboard template. Its code is unique within a tenant. */
export class TieredLeaderboardTemplate {
  code: string;
  label: string;
  segment: string;
  endsAt: number;
  ownerId: string;
  revision: number;
  status: TieredLeaderboardTemplateStatus;

  constructor(
    code: string,
    label: string,
    segment: string,
    endsAt: number,
    ownerId: string,
    revision: number,
    status: TieredLeaderboardTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.segment = segment;
    this.endsAt = endsAt;
    this.ownerId = ownerId;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredLeaderboardTemplateStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredLeaderboardTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered leaderboard template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"tiered leaderboard template"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.endsAt - this.revision) * 100) / 100;
  }

  copy(): TieredLeaderboardTemplate {
    return new TieredLeaderboardTemplate(
      this.code,
      this.label,
      this.segment,
      this.endsAt,
      this.ownerId,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a tiered leaderboard template in status created. */
export function newTieredLeaderboardTemplate(code: string, label: string): TieredLeaderboardTemplate {
  return new TieredLeaderboardTemplate(code, label, "", 0, "", 0, "created");
}
