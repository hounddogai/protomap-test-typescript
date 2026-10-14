/**
 * The batched touchpoint variance records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched touchpoint variance is in its life cycle. */
export type BatchedTouchpointVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** A batched touchpoint variance. Its code is unique within a tenant. */
export class BatchedTouchpointVariance {
  code: string;
  title: string;
  ratio: number;
  ceiling: number;
  source: string;
  status: BatchedTouchpointVarianceStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    ceiling: number,
    source: string,
    status: BatchedTouchpointVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.ceiling = ceiling;
    this.source = source;
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

  canMoveTo(next: BatchedTouchpointVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        switch (next) {
          case "done":
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

  moveTo(next: BatchedTouchpointVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched touchpoint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedTotal(): number {
    return Math.round((this.ceiling + this.ratio) * 100) / 100;
  }

  copy(): BatchedTouchpointVariance {
    return new BatchedTouchpointVariance(this.code, this.title, this.ratio, this.ceiling, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a batched touchpoint variance in status new. */
export function newBatchedTouchpointVariance(code: string, title: string): BatchedTouchpointVariance {
  return new BatchedTouchpointVariance(code, title, 0, 0, "", "new");
}
