import * as text from "../../../../kit/text.js";

/** Where a batched activation batch is in its life cycle. */
export type BatchedActivationBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One batched activation batch, with what the planners need to act on it. */
export class BatchedActivationBatch {
  code: string;
  title: string;
  updatedAt: number;
  country: string;
  category: string;
  discount: number;
  durationMinutes: number;
  timezone: string;
  status: BatchedActivationBatchStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    country: string,
    category: string,
    discount: number,
    durationMinutes: number,
    timezone: string,
    status: BatchedActivationBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.country = country;
    this.category = category;
    this.discount = discount;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
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

  canMoveTo(next: BatchedActivationBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: BatchedActivationBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched activation batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedVolume(): number {
    return Math.round((this.discount + this.durationMinutes) * 100) / 100;
  }

  copy(): BatchedActivationBatch {
    return new BatchedActivationBatch(
      this.code,
      this.title,
      this.updatedAt,
      this.country,
      this.category,
      this.discount,
      this.durationMinutes,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched activation batch in status proposed. */
export function newBatchedActivationBatch(code: string, title: string): BatchedActivationBatch {
  return new BatchedActivationBatch(code, title, 0, "", "", 0, 0, "", "proposed");
}
