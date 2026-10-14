/**
 * The streak batch records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak batch is in its life cycle. */
export type StreakBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** A streak batch. Its code is unique within a tenant. */
export class StreakBatch {
  code: string;
  title: string;
  ratio: number;
  channel: string;
  utmSource: string;
  rate: number;
  status: StreakBatchStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    channel: string,
    utmSource: string,
    rate: number,
    status: StreakBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.channel = channel;
    this.utmSource = utmSource;
    this.rate = rate;
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

  canMoveTo(next: StreakBatchStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        switch (next) {
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

  moveTo(next: StreakBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netLoad(): number {
    return Math.round((this.rate + this.ratio) * 100) / 100;
  }

  copy(): StreakBatch {
    return new StreakBatch(this.code, this.title, this.ratio, this.channel, this.utmSource, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a streak batch in status new. */
export function newStreakBatch(code: string, title: string): StreakBatch {
  return new StreakBatch(code, title, 0, "", "", 0, "new");
}
