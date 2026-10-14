import * as text from "../../../../kit/text.js";

/** Where a batched warmup batch is in its life cycle. */
export type BatchedWarmupBatchStatus = "created" | "validated" | "published" | "retired";

/** One batched warmup batch, with what the planners need to act on it. */
export class BatchedWarmupBatch {
  code: string;
  title: string;
  approved: boolean;
  expiresAt: number;
  currency: string;
  attributes: Map<string, string>;
  impressions: number;
  revision: number;
  category: string;
  timezone: string;
  region: string;
  status: BatchedWarmupBatchStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    expiresAt: number,
    currency: string,
    attributes: Map<string, string>,
    impressions: number,
    revision: number,
    category: string,
    timezone: string,
    region: string,
    status: BatchedWarmupBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.attributes = attributes;
    this.impressions = impressions;
    this.revision = revision;
    this.category = category;
    this.timezone = timezone;
    this.region = region;
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

  canMoveTo(next: BatchedWarmupBatchStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: BatchedWarmupBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched warmup batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"batched warmup batch"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.expiresAt - this.impressions) * 100) / 100;
  }

  copy(): BatchedWarmupBatch {
    return new BatchedWarmupBatch(
      this.code,
      this.title,
      this.approved,
      this.expiresAt,
      this.currency,
      this.attributes,
      this.impressions,
      this.revision,
      this.category,
      this.timezone,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a batched warmup batch in status created. */
export function newBatchedWarmupBatch(code: string, title: string): BatchedWarmupBatch {
  return new BatchedWarmupBatch(code, title, false, 0, "", new Map<string, string>(), 0, 0, "", "", "", "created");
}
