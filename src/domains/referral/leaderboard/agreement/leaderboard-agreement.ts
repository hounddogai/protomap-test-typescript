/**
 * The leaderboard agreement records of referral's leaderboard work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a leaderboard agreement is in its life cycle. */
export type LeaderboardAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A leaderboard agreement as the leaderboard team keeps it. */
export class LeaderboardAgreement {
  code: string;
  name: string;
  category: string;
  approved: boolean;
  phone: string;
  ratio: number;
  status: LeaderboardAgreementStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    approved: boolean,
    phone: string,
    ratio: number,
    status: LeaderboardAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.approved = approved;
    this.phone = phone;
    this.ratio = ratio;
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

  canMoveTo(next: LeaderboardAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: LeaderboardAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"leaderboard agreement"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): LeaderboardAgreement {
    return new LeaderboardAgreement(
      this.code,
      this.name,
      this.category,
      this.approved,
      this.phone,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a leaderboard agreement in status planned. */
export function newLeaderboardAgreement(code: string, name: string): LeaderboardAgreement {
  return new LeaderboardAgreement(code, name, "", false, "", 0, "planned");
}
