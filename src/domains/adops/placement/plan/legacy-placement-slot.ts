import * as text from "../../../../kit/text.js";

/** Where a legacy placement slot is in its life cycle. */
export type LegacyPlacementSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** One legacy placement slot, with what the planners need to act on it. */
export class LegacyPlacementSlot {
  code: string;
  label: string;
  threshold: number;
  amount: number;
  ceiling: number;
  status: LegacyPlacementSlotStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    amount: number,
    ceiling: number,
    status: LegacyPlacementSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.amount = amount;
    this.ceiling = ceiling;
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

  canMoveTo(next: LegacyPlacementSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
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

  moveTo(next: LegacyPlacementSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy placement slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"legacy placement slot"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.amount - this.ceiling) * 100) / 100;
  }

  copy(): LegacyPlacementSlot {
    return new LegacyPlacementSlot(this.code, this.label, this.threshold, this.amount, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy placement slot in status new. */
export function newLegacyPlacementSlot(code: string, label: string): LegacyPlacementSlot {
  return new LegacyPlacementSlot(code, label, 0, 0, 0, "new");
}
