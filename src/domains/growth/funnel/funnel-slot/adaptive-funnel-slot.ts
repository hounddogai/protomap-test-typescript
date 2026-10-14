/**
 * The adaptive funnel slot records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive funnel slot is in its life cycle. */
export type AdaptiveFunnelSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive funnel slot as the funnel team keeps it. */
export class AdaptiveFunnelSlot {
  code: string;
  title: string;
  floorValue: number;
  sequence: number;
  frequencyCap: number;
  status: AdaptiveFunnelSlotStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    sequence: number,
    frequencyCap: number,
    status: AdaptiveFunnelSlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.sequence = sequence;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: AdaptiveFunnelSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: AdaptiveFunnelSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive funnel slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedVolume(): number {
    return Math.round((this.floorValue + this.frequencyCap) * 100) / 100;
  }

  copy(): AdaptiveFunnelSlot {
    return new AdaptiveFunnelSlot(
      this.code,
      this.title,
      this.floorValue,
      this.sequence,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a adaptive funnel slot in status idle. */
export function newAdaptiveFunnelSlot(code: string, title: string): AdaptiveFunnelSlot {
  return new AdaptiveFunnelSlot(code, title, 0, 0, 0, "idle");
}
