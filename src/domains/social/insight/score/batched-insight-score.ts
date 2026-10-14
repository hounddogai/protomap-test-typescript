/**
 * The batched insight score records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched insight score is in its life cycle. */
export type BatchedInsightScoreStatus = "requested" | "granted" | "revoked" | "expired";

/** One batched insight score, with what the planners need to act on it. */
export class BatchedInsightScore {
  code: string;
  title: string;
  threshold: number;
  clicks: number;
  attributes: Map<string, string>;
  status: BatchedInsightScoreStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    clicks: number,
    attributes: Map<string, string>,
    status: BatchedInsightScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.clicks = clicks;
    this.attributes = attributes;
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

  canMoveTo(next: BatchedInsightScoreStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedInsightScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched insight score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"batched insight score"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round((this.clicks + this.threshold) * 100) / 100;
  }

  copy(): BatchedInsightScore {
    return new BatchedInsightScore(this.code, this.title, this.threshold, this.clicks, this.attributes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched insight score in status requested. */
export function newBatchedInsightScore(code: string, title: string): BatchedInsightScore {
  return new BatchedInsightScore(code, title, 0, 0, new Map<string, string>(), "requested");
}
