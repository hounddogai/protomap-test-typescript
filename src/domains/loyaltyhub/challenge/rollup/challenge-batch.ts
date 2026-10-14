import * as text from "../../../../kit/text.js";

/** Where a challenge batch is in its life cycle. */
export type ChallengeBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A challenge batch as the challenge team keeps it. */
export class ChallengeBatch {
  code: string;
  name: string;
  campaignRef: string;
  windowDays: number;
  budget: number;
  channel: string;
  openRate: number;
  category: string;
  updatedAt: number;
  limit: number;
  expiresAt: number;
  status: ChallengeBatchStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    windowDays: number,
    budget: number,
    channel: string,
    openRate: number,
    category: string,
    updatedAt: number,
    limit: number,
    expiresAt: number,
    status: ChallengeBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.windowDays = windowDays;
    this.budget = budget;
    this.channel = channel;
    this.openRate = openRate;
    this.category = category;
    this.updatedAt = updatedAt;
    this.limit = limit;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: ChallengeBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: ChallengeBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.openRate + this.updatedAt) * 100) / 100;
  }

  copy(): ChallengeBatch {
    return new ChallengeBatch(
      this.code,
      this.name,
      this.campaignRef,
      this.windowDays,
      this.budget,
      this.channel,
      this.openRate,
      this.category,
      this.updatedAt,
      this.limit,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a challenge batch in status draft. */
export function newChallengeBatch(code: string, name: string): ChallengeBatch {
  return new ChallengeBatch(code, name, "", 0, 0, "", 0, "", 0, 0, 0, "draft");
}
