import * as text from "../../../../kit/text.js";

/** Where a pending reward slot is in its life cycle. */
export type PendingRewardSlotStatus = "created" | "validated" | "published" | "retired";

/** One pending reward slot, with what the planners need to act on it. */
export class PendingRewardSlot {
  code: string;
  label: string;
  variant: string;
  margin: number;
  windowDays: number;
  status: PendingRewardSlotStatus;

  constructor(
    code: string,
    label: string,
    variant: string,
    margin: number,
    windowDays: number,
    status: PendingRewardSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.variant = variant;
    this.margin = margin;
    this.windowDays = windowDays;
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

  canMoveTo(next: PendingRewardSlotStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingRewardSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending reward slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.margin - this.windowDays) * 100) / 100;
  }

  copy(): PendingRewardSlot {
    return new PendingRewardSlot(this.code, this.label, this.variant, this.margin, this.windowDays, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a pending reward slot in status created. */
export function newPendingRewardSlot(code: string, label: string): PendingRewardSlot {
  return new PendingRewardSlot(code, label, "", 0, 0, "created");
}
