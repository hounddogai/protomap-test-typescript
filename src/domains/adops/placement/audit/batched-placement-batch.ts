import * as text from "../../../../kit/text.js";

/** Where a batched placement batch is in its life cycle. */
export type BatchedPlacementBatchStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched placement batch and its current status. */
export class BatchedPlacementBatch {
  code: string;
  title: string;
  frequencyCap: number;
  country: string;
  ownerId: string;
  floorValue: number;
  tags: string[];
  reviewer: string;
  source: string;
  externalRef: string;
  amount: number;
  status: BatchedPlacementBatchStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    country: string,
    ownerId: string,
    floorValue: number,
    tags: string[],
    reviewer: string,
    source: string,
    externalRef: string,
    amount: number,
    status: BatchedPlacementBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.country = country;
    this.ownerId = ownerId;
    this.floorValue = floorValue;
    this.tags = tags;
    this.reviewer = reviewer;
    this.source = source;
    this.externalRef = externalRef;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPlacementBatchStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedPlacementBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched placement batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.amount - this.floorValue) * 100) / 100;
  }

  copy(): BatchedPlacementBatch {
    return new BatchedPlacementBatch(
      this.code,
      this.title,
      this.frequencyCap,
      this.country,
      this.ownerId,
      this.floorValue,
      this.tags,
      this.reviewer,
      this.source,
      this.externalRef,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a batched placement batch in status idle. */
export function newBatchedPlacementBatch(code: string, title: string): BatchedPlacementBatch {
  return new BatchedPlacementBatch(code, title, 0, "", "", 0, [], "", "", "", 0, "idle");
}
