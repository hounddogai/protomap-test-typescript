/**
 * The batched opt out score records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched opt out score is in its life cycle. */
export type BatchedOptOutScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** One batched opt out score, with what the planners need to act on it. */
export class BatchedOptOutScore {
  code: string;
  title: string;
  floorValue: number;
  startsAt: number;
  minimum: number;
  ratio: number;
  budget: number;
  channel: string;
  locale: string;
  batchSize: number;
  limit: number;
  status: BatchedOptOutScoreStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    startsAt: number,
    minimum: number,
    ratio: number,
    budget: number,
    channel: string,
    locale: string,
    batchSize: number,
    limit: number,
    status: BatchedOptOutScoreStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.ratio = ratio;
    this.budget = budget;
    this.channel = channel;
    this.locale = locale;
    this.batchSize = batchSize;
    this.limit = limit;
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

  canMoveTo(next: BatchedOptOutScoreStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BatchedOptOutScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched opt out score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.limit + this.ratio) * 100) / 100;
  }

  copy(): BatchedOptOutScore {
    return new BatchedOptOutScore(
      this.code,
      this.title,
      this.floorValue,
      this.startsAt,
      this.minimum,
      this.ratio,
      this.budget,
      this.channel,
      this.locale,
      this.batchSize,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a batched opt out score in status new. */
export function newBatchedOptOutScore(code: string, title: string): BatchedOptOutScore {
  return new BatchedOptOutScore(code, title, 0, 0, 0, 0, 0, "", "", 0, 0, "new");
}
