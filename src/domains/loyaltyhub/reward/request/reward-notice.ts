import * as text from "../../../../kit/text.js";

/** Where a reward notice is in its life cycle. */
export type RewardNoticeStatus = "created" | "validated" | "published" | "retired";

/** The record of a reward notice and its current status. */
export class RewardNotice {
  code: string;
  label: string;
  unit: string;
  attempts: number;
  pinned: boolean;
  checksum: string;
  maximum: number;
  source: string;
  status: RewardNoticeStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    attempts: number,
    pinned: boolean,
    checksum: string,
    maximum: number,
    source: string,
    status: RewardNoticeStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.attempts = attempts;
    this.pinned = pinned;
    this.checksum = checksum;
    this.maximum = maximum;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RewardNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedExposure(): number {
    return Math.round(this.attempts * this.maximum * 100) / 100;
  }

  copy(): RewardNotice {
    return new RewardNotice(
      this.code,
      this.label,
      this.unit,
      this.attempts,
      this.pinned,
      this.checksum,
      this.maximum,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a reward notice in status created. */
export function newRewardNotice(code: string, label: string): RewardNotice {
  return new RewardNotice(code, label, "", 0, false, "", 0, "", "created");
}
