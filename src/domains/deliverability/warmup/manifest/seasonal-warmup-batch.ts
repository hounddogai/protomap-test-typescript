import * as text from "../../../../kit/text.js";

/** Where a seasonal warmup batch is in its life cycle. */
export type SeasonalWarmupBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal warmup batch. Its code is unique within a tenant. */
export class SeasonalWarmupBatch {
  code: string;
  title: string;
  margin: number;
  approved: boolean;
  channel: string;
  bid: number;
  status: SeasonalWarmupBatchStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    approved: boolean,
    channel: string,
    bid: number,
    status: SeasonalWarmupBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.approved = approved;
    this.channel = channel;
    this.bid = bid;
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

  canMoveTo(next: SeasonalWarmupBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SeasonalWarmupBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal warmup batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal warmup batch"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.bid - this.margin) * 100) / 100;
  }

  copy(): SeasonalWarmupBatch {
    return new SeasonalWarmupBatch(
      this.code,
      this.title,
      this.margin,
      this.approved,
      this.channel,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a seasonal warmup batch in status requested. */
export function newSeasonalWarmupBatch(code: string, title: string): SeasonalWarmupBatch {
  return new SeasonalWarmupBatch(code, title, 0, false, "", 0, "requested");
}
