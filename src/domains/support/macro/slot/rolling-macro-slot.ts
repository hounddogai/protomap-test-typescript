/**
 * The rolling macro slot records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling macro slot is in its life cycle. */
export type RollingMacroSlotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a rolling macro slot and its current status. */
export class RollingMacroSlot {
  code: string;
  label: string;
  clicks: number;
  channel: string;
  name: string;
  maximum: number;
  description: string;
  status: RollingMacroSlotStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    channel: string,
    name: string,
    maximum: number,
    description: string,
    status: RollingMacroSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.channel = channel;
    this.name = name;
    this.maximum = maximum;
    this.description = description;
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

  canMoveTo(next: RollingMacroSlotStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RollingMacroSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling macro slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.maximum * this.clicks * 100) / 100;
  }

  copy(): RollingMacroSlot {
    return new RollingMacroSlot(
      this.code,
      this.label,
      this.clicks,
      this.channel,
      this.name,
      this.maximum,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a rolling macro slot in status proposed. */
export function newRollingMacroSlot(code: string, label: string): RollingMacroSlot {
  return new RollingMacroSlot(code, label, 0, "", "", 0, "", "proposed");
}
