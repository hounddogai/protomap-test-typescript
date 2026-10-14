import * as text from "../../../../kit/text.js";

/** Where a batched sender batch is in its life cycle. */
export type BatchedSenderBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched sender batch, with what the planners need to act on it. */
export class BatchedSenderBatch {
  code: string;
  label: string;
  name: string;
  openRate: number;
  revision: number;
  country: string;
  ceiling: number;
  status: BatchedSenderBatchStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    openRate: number,
    revision: number,
    country: string,
    ceiling: number,
    status: BatchedSenderBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.openRate = openRate;
    this.revision = revision;
    this.country = country;
    this.ceiling = ceiling;
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

  canMoveTo(next: BatchedSenderBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedSenderBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched sender batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  netTotal(): number {
    return Math.round(this.openRate * this.revision * 100) / 100;
  }

  copy(): BatchedSenderBatch {
    return new BatchedSenderBatch(
      this.code,
      this.label,
      this.name,
      this.openRate,
      this.revision,
      this.country,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched sender batch in status new. */
export function newBatchedSenderBatch(code: string, label: string): BatchedSenderBatch {
  return new BatchedSenderBatch(code, label, "", 0, 0, "", 0, "new");
}
