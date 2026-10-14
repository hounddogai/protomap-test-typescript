/**
 * The window rollup records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window rollup is in its life cycle. */
export type WindowRollupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A window rollup as the window team keeps it. */
export class WindowRollup {
  code: string;
  label: string;
  timezone: string;
  maximum: number;
  checksum: string;
  status: WindowRollupStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    maximum: number,
    checksum: string,
    status: WindowRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.maximum = maximum;
    this.checksum = checksum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowRollupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WindowRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): WindowRollup {
    return new WindowRollup(this.code, this.label, this.timezone, this.maximum, this.checksum, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a window rollup in status proposed. */
export function newWindowRollup(code: string, label: string): WindowRollup {
  return new WindowRollup(code, label, "", 0, "", "proposed");
}
