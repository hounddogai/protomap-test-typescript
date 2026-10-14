import * as text from "../../../../kit/text.js";

/** Where a legacy leaderboard quota is in its life cycle. */
export type LegacyLeaderboardQuotaStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A legacy leaderboard quota as the leaderboard team keeps it. */
export class LegacyLeaderboardQuota {
  code: string;
  name: string;
  graceDays: number;
  createdAt: number;
  currency: string;
  status: LegacyLeaderboardQuotaStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    createdAt: number,
    currency: string,
    status: LegacyLeaderboardQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.currency = currency;
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

  canMoveTo(next: LegacyLeaderboardQuotaStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
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
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyLeaderboardQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy leaderboard quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.graceDays - this.createdAt) * 100) / 100;
  }

  copy(): LegacyLeaderboardQuota {
    return new LegacyLeaderboardQuota(this.code, this.name, this.graceDays, this.createdAt, this.currency, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy leaderboard quota in status open. */
export function newLegacyLeaderboardQuota(code: string, name: string): LegacyLeaderboardQuota {
  return new LegacyLeaderboardQuota(code, name, 0, 0, "", "open");
}
