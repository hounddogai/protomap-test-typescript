import * as text from "../../../../kit/text.js";

/** Where a global retention window is in its life cycle. */
export type GlobalRetentionWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a global retention window and its current status. */
export class GlobalRetentionWindow {
  code: string;
  label: string;
  floorValue: number;
  checksum: string;
  description: string;
  country: string;
  variant: string;
  attempts: number;
  quantity: number;
  status: GlobalRetentionWindowStatus;

  constructor(
    code: string,
    label: string,
    floorValue: number,
    checksum: string,
    description: string,
    country: string,
    variant: string,
    attempts: number,
    quantity: number,
    status: GlobalRetentionWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.floorValue = floorValue;
    this.checksum = checksum;
    this.description = description;
    this.country = country;
    this.variant = variant;
    this.attempts = attempts;
    this.quantity = quantity;
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

  canMoveTo(next: GlobalRetentionWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalRetentionWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global retention window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.quantity * this.floorValue * 100) / 100;
  }

  copy(): GlobalRetentionWindow {
    return new GlobalRetentionWindow(
      this.code,
      this.label,
      this.floorValue,
      this.checksum,
      this.description,
      this.country,
      this.variant,
      this.attempts,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a global retention window in status idle. */
export function newGlobalRetentionWindow(code: string, label: string): GlobalRetentionWindow {
  return new GlobalRetentionWindow(code, label, 0, "", "", "", "", 0, 0, "idle");
}
