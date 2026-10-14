import * as text from "../../../../kit/text.js";

/** Where a tiered warmup batch is in its life cycle. */
export type TieredWarmupBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A tiered warmup batch. Its code is unique within a tenant. */
export class TieredWarmupBatch {
  code: string;
  title: string;
  archived: boolean;
  budget: number;
  currency: string;
  audienceId: string;
  summary: string;
  unit: string;
  expiresAt: number;
  country: string;
  pinned: boolean;
  status: TieredWarmupBatchStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    budget: number,
    currency: string,
    audienceId: string,
    summary: string,
    unit: string,
    expiresAt: number,
    country: string,
    pinned: boolean,
    status: TieredWarmupBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.budget = budget;
    this.currency = currency;
    this.audienceId = audienceId;
    this.summary = summary;
    this.unit = unit;
    this.expiresAt = expiresAt;
    this.country = country;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredWarmupBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredWarmupBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered warmup batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netValue(): number {
    return Math.round((this.expiresAt - this.budget) * 100) / 100;
  }

  copy(): TieredWarmupBatch {
    return new TieredWarmupBatch(
      this.code,
      this.title,
      this.archived,
      this.budget,
      this.currency,
      this.audienceId,
      this.summary,
      this.unit,
      this.expiresAt,
      this.country,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a tiered warmup batch in status proposed. */
export function newTieredWarmupBatch(code: string, title: string): TieredWarmupBatch {
  return new TieredWarmupBatch(code, title, false, 0, "", "", "", "", 0, "", false, "proposed");
}
