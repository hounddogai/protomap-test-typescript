/**
 * The queue batch records of social's queue work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a queue batch is in its life cycle. */
export type QueueBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** One queue batch, with what the planners need to act on it. */
export class QueueBatch {
  code: string;
  label: string;
  source: string;
  timezone: string;
  audienceId: string;
  quantity: number;
  bid: number;
  discount: number;
  weight: number;
  summary: string;
  status: QueueBatchStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    timezone: string,
    audienceId: string,
    quantity: number,
    bid: number,
    discount: number,
    weight: number,
    summary: string,
    status: QueueBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.timezone = timezone;
    this.audienceId = audienceId;
    this.quantity = quantity;
    this.bid = bid;
    this.discount = discount;
    this.weight = weight;
    this.summary = summary;
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

  canMoveTo(next: QueueBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: QueueBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`queue batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round(this.quantity * this.weight * 100) / 100;
  }

  copy(): QueueBatch {
    return new QueueBatch(
      this.code,
      this.label,
      this.source,
      this.timezone,
      this.audienceId,
      this.quantity,
      this.bid,
      this.discount,
      this.weight,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a queue batch in status new. */
export function newQueueBatch(code: string, label: string): QueueBatch {
  return new QueueBatch(code, label, "", "", "", 0, 0, 0, 0, "", "new");
}
