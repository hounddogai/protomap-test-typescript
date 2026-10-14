import * as text from "../../../../kit/text.js";

/** Where a batched mention milestone is in its life cycle. */
export type BatchedMentionMilestoneStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched mention milestone, with what the planners need to act on it. */
export class BatchedMentionMilestone {
  code: string;
  name: string;
  archived: boolean;
  batchSize: number;
  updatedAt: number;
  attributes: Map<string, string>;
  country: string;
  attempts: number;
  ratio: number;
  limit: number;
  amount: number;
  status: BatchedMentionMilestoneStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    batchSize: number,
    updatedAt: number,
    attributes: Map<string, string>,
    country: string,
    attempts: number,
    ratio: number,
    limit: number,
    amount: number,
    status: BatchedMentionMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.batchSize = batchSize;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.country = country;
    this.attempts = attempts;
    this.ratio = ratio;
    this.limit = limit;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedMentionMilestoneStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedMentionMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched mention milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round(this.attempts * this.ratio * 100) / 100;
  }

  copy(): BatchedMentionMilestone {
    return new BatchedMentionMilestone(
      this.code,
      this.name,
      this.archived,
      this.batchSize,
      this.updatedAt,
      this.attributes,
      this.country,
      this.attempts,
      this.ratio,
      this.limit,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched mention milestone in status requested. */
export function newBatchedMentionMilestone(code: string, name: string): BatchedMentionMilestone {
  return new BatchedMentionMilestone(code, name, false, 0, 0, new Map<string, string>(), "", 0, 0, 0, 0, "requested");
}
