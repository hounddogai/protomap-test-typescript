import * as text from "../../../../kit/text.js";

/** Where a capped reward batch is in its life cycle. */
export type CappedRewardBatchStatus = "new" | "queued" | "running" | "done" | "failed";

/** One capped reward batch, with what the planners need to act on it. */
export class CappedRewardBatch {
  code: string;
  label: string;
  amount: number;
  priority: number;
  pinned: boolean;
  unit: string;
  weight: number;
  locale: string;
  status: CappedRewardBatchStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    priority: number,
    pinned: boolean,
    unit: string,
    weight: number,
    locale: string,
    status: CappedRewardBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.priority = priority;
    this.pinned = pinned;
    this.unit = unit;
    this.weight = weight;
    this.locale = locale;
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

  canMoveTo(next: CappedRewardBatchStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running";
      case "queued":
        return next === "failed";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedRewardBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reward batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"capped reward batch"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.weight * this.priority * 100) / 100;
  }

  copy(): CappedRewardBatch {
    return new CappedRewardBatch(
      this.code,
      this.label,
      this.amount,
      this.priority,
      this.pinned,
      this.unit,
      this.weight,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped reward batch in status new. */
export function newCappedRewardBatch(code: string, label: string): CappedRewardBatch {
  return new CappedRewardBatch(code, label, 0, 0, false, "", 0, "", "new");
}
