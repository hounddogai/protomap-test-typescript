import * as text from "../../../../kit/text.js";

/** Where a batched pacing request is in its life cycle. */
export type BatchedPacingRequestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A batched pacing request as the pacing team keeps it. */
export class BatchedPacingRequest {
  code: string;
  label: string;
  batchSize: number;
  frequencyCap: number;
  quantity: number;
  description: string;
  tags: string[];
  version: number;
  bid: number;
  unit: string;
  status: BatchedPacingRequestStatus;

  constructor(
    code: string,
    label: string,
    batchSize: number,
    frequencyCap: number,
    quantity: number,
    description: string,
    tags: string[],
    version: number,
    bid: number,
    unit: string,
    status: BatchedPacingRequestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.batchSize = batchSize;
    this.frequencyCap = frequencyCap;
    this.quantity = quantity;
    this.description = description;
    this.tags = tags;
    this.version = version;
    this.bid = bid;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPacingRequestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPacingRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched pacing request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedValue(): number {
    return Math.round(this.batchSize * this.bid * 100) / 100;
  }

  copy(): BatchedPacingRequest {
    return new BatchedPacingRequest(
      this.code,
      this.label,
      this.batchSize,
      this.frequencyCap,
      this.quantity,
      this.description,
      this.tags,
      this.version,
      this.bid,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a batched pacing request in status open. */
export function newBatchedPacingRequest(code: string, label: string): BatchedPacingRequest {
  return new BatchedPacingRequest(code, label, 0, 0, 0, "", [], 0, 0, "", "open");
}
