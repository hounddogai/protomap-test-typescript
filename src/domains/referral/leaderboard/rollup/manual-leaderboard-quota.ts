import * as text from "../../../../kit/text.js";

/** Where a manual leaderboard quota is in its life cycle. */
export type ManualLeaderboardQuotaStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual leaderboard quota. Its code is unique within a tenant. */
export class ManualLeaderboardQuota {
  code: string;
  name: string;
  locale: string;
  title: string;
  region: string;
  sequence: number;
  status: ManualLeaderboardQuotaStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    title: string,
    region: string,
    sequence: number,
    status: ManualLeaderboardQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.title = title;
    this.region = region;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualLeaderboardQuotaStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualLeaderboardQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual leaderboard quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): ManualLeaderboardQuota {
    return new ManualLeaderboardQuota(
      this.code,
      this.name,
      this.locale,
      this.title,
      this.region,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual leaderboard quota in status new. */
export function newManualLeaderboardQuota(code: string, name: string): ManualLeaderboardQuota {
  return new ManualLeaderboardQuota(code, name, "", "", "", 0, "new");
}
