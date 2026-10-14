import * as text from "../../../../kit/text.js";

/** Where a adaptive payout slot is in its life cycle. */
export type AdaptivePayoutSlotStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a adaptive payout slot and its current status. */
export class AdaptivePayoutSlot {
  code: string;
  title: string;
  ceiling: number;
  externalRef: string;
  floorValue: number;
  visible: boolean;
  minimum: number;
  status: AdaptivePayoutSlotStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    externalRef: string,
    floorValue: number,
    visible: boolean,
    minimum: number,
    status: AdaptivePayoutSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
    this.floorValue = floorValue;
    this.visible = visible;
    this.minimum = minimum;
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

  canMoveTo(next: AdaptivePayoutSlotStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "done";
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

  moveTo(next: AdaptivePayoutSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive payout slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round(this.minimum * this.floorValue * 100) / 100;
  }

  copy(): AdaptivePayoutSlot {
    return new AdaptivePayoutSlot(
      this.code,
      this.title,
      this.ceiling,
      this.externalRef,
      this.floorValue,
      this.visible,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive payout slot in status new. */
export function newAdaptivePayoutSlot(code: string, title: string): AdaptivePayoutSlot {
  return new AdaptivePayoutSlot(code, title, 0, "", 0, false, 0, "new");
}
