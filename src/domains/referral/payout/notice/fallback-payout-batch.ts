import * as text from "../../../../kit/text.js";

/** Where a fallback payout batch is in its life cycle. */
export type FallbackPayoutBatchStatus = "created" | "validated" | "published" | "retired";

/** A fallback payout batch. Its code is unique within a tenant. */
export class FallbackPayoutBatch {
  code: string;
  title: string;
  version: number;
  margin: number;
  timezone: string;
  sequence: number;
  retries: number;
  ceiling: number;
  sendAt: number;
  budget: number;
  status: FallbackPayoutBatchStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    margin: number,
    timezone: string,
    sequence: number,
    retries: number,
    ceiling: number,
    sendAt: number,
    budget: number,
    status: FallbackPayoutBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.margin = margin;
    this.timezone = timezone;
    this.sequence = sequence;
    this.retries = retries;
    this.ceiling = ceiling;
    this.sendAt = sendAt;
    this.budget = budget;
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

  canMoveTo(next: FallbackPayoutBatchStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackPayoutBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback payout batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round(this.budget * this.ceiling * 100) / 100;
  }

  copy(): FallbackPayoutBatch {
    return new FallbackPayoutBatch(
      this.code,
      this.title,
      this.version,
      this.margin,
      this.timezone,
      this.sequence,
      this.retries,
      this.ceiling,
      this.sendAt,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback payout batch in status created. */
export function newFallbackPayoutBatch(code: string, title: string): FallbackPayoutBatch {
  return new FallbackPayoutBatch(code, title, 0, 0, "", 0, 0, 0, 0, 0, "created");
}
