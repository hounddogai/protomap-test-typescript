import * as text from "../../../../kit/text.js";

/** Where a redemption baseline is in its life cycle. */
export type RedemptionBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a redemption baseline and its current status. */
export class RedemptionBaseline {
  code: string;
  label: string;
  title: string;
  floorValue: number;
  notes: string;
  status: RedemptionBaselineStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    floorValue: number,
    notes: string,
    status: RedemptionBaselineStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.floorValue = floorValue;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: RedemptionBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RedemptionBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`redemption baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): RedemptionBaseline {
    return new RedemptionBaseline(this.code, this.label, this.title, this.floorValue, this.notes, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a redemption baseline in status idle. */
export function newRedemptionBaseline(code: string, label: string): RedemptionBaseline {
  return new RedemptionBaseline(code, label, "", 0, "", "idle");
}
