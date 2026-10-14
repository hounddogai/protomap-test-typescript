import * as text from "../../../../kit/text.js";

/** Where a pending reward score is in its life cycle. */
export type PendingRewardScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a pending reward score and its current status. */
export class PendingRewardScore {
  code: string;
  label: string;
  unit: string;
  impressions: number;
  sendAt: number;
  ceiling: number;
  attempts: number;
  maximum: number;
  rate: number;
  status: PendingRewardScoreStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    impressions: number,
    sendAt: number,
    ceiling: number,
    attempts: number,
    maximum: number,
    rate: number,
    status: PendingRewardScoreStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.ceiling = ceiling;
    this.attempts = attempts;
    this.maximum = maximum;
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

  canMoveTo(next: PendingRewardScoreStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PendingRewardScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedValue(): number {
    return Math.round((this.sendAt + this.attempts) * 100) / 100;
  }

  copy(): PendingRewardScore {
    return new PendingRewardScore(
      this.code,
      this.label,
      this.unit,
      this.impressions,
      this.sendAt,
      this.ceiling,
      this.attempts,
      this.maximum,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a pending reward score in status new. */
export function newPendingRewardScore(code: string, label: string): PendingRewardScore {
  return new PendingRewardScore(code, label, "", 0, 0, 0, 0, 0, 0, "new");
}
