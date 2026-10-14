/**
 * The regional pacing slot records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional pacing slot is in its life cycle. */
export type RegionalPacingSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One regional pacing slot, with what the planners need to act on it. */
export class RegionalPacingSlot {
  code: string;
  label: string;
  cost: number;
  impressions: number;
  title: string;
  margin: number;
  status: RegionalPacingSlotStatus;

  constructor(
    code: string,
    label: string,
    cost: number,
    impressions: number,
    title: string,
    margin: number,
    status: RegionalPacingSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cost = cost;
    this.impressions = impressions;
    this.title = title;
    this.margin = margin;
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

  canMoveTo(next: RegionalPacingSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: RegionalPacingSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional pacing slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedExposure(): number {
    return Math.round((this.impressions + this.cost) * 100) / 100;
  }

  copy(): RegionalPacingSlot {
    return new RegionalPacingSlot(
      this.code,
      this.label,
      this.cost,
      this.impressions,
      this.title,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional pacing slot in status idle. */
export function newRegionalPacingSlot(code: string, label: string): RegionalPacingSlot {
  return new RegionalPacingSlot(code, label, 0, 0, "", 0, "idle");
}
