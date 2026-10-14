import * as text from "../../../../kit/text.js";

/** Where a leaderboard batch is in its life cycle. */
export type LeaderboardBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A leaderboard batch as the leaderboard team keeps it. */
export class LeaderboardBatch {
  code: string;
  name: string;
  batchSize: number;
  bid: number;
  title: string;
  impressions: number;
  endsAt: number;
  externalRef: string;
  contactEmail: string;
  sequence: number;
  openRate: number;
  status: LeaderboardBatchStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    bid: number,
    title: string,
    impressions: number,
    endsAt: number,
    externalRef: string,
    contactEmail: string,
    sequence: number,
    openRate: number,
    status: LeaderboardBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.bid = bid;
    this.title = title;
    this.impressions = impressions;
    this.endsAt = endsAt;
    this.externalRef = externalRef;
    this.contactEmail = contactEmail;
    this.sequence = sequence;
    this.openRate = openRate;
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

  canMoveTo(next: LeaderboardBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LeaderboardBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`leaderboard batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"leaderboard batch"} ${this.code}`;
  }

  weightedValue(): number {
    return Math.round((this.sequence + this.openRate) * 100) / 100;
  }

  copy(): LeaderboardBatch {
    return new LeaderboardBatch(
      this.code,
      this.name,
      this.batchSize,
      this.bid,
      this.title,
      this.impressions,
      this.endsAt,
      this.externalRef,
      this.contactEmail,
      this.sequence,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a leaderboard batch in status new. */
export function newLeaderboardBatch(code: string, name: string): LeaderboardBatch {
  return new LeaderboardBatch(code, name, 0, 0, "", 0, 0, "", "", 0, 0, "new");
}
