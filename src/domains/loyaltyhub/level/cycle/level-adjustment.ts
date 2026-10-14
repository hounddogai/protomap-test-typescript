import * as text from "../../../../kit/text.js";

/** Where a level adjustment is in its life cycle. */
export type LevelAdjustmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a level adjustment and its current status. */
export class LevelAdjustment {
  code: string;
  title: string;
  batchSize: number;
  channel: string;
  amount: number;
  status: LevelAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    channel: string,
    amount: number,
    status: LevelAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.channel = channel;
    this.amount = amount;
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

  canMoveTo(next: LevelAdjustmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
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

  moveTo(next: LevelAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"level adjustment"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round(this.amount * this.batchSize * 100) / 100;
  }

  copy(): LevelAdjustment {
    return new LevelAdjustment(this.code, this.title, this.batchSize, this.channel, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a level adjustment in status new. */
export function newLevelAdjustment(code: string, title: string): LevelAdjustment {
  return new LevelAdjustment(code, title, 0, "", 0, "new");
}
