/**
 * The weighted frequency slot records of adops's frequency work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted frequency slot is in its life cycle. */
export type WeightedFrequencySlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A weighted frequency slot. Its code is unique within a tenant. */
export class WeightedFrequencySlot {
  code: string;
  title: string;
  unit: string;
  variant: string;
  floorValue: number;
  source: string;
  startsAt: number;
  status: WeightedFrequencySlotStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    variant: string,
    floorValue: number,
    source: string,
    startsAt: number,
    status: WeightedFrequencySlotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.variant = variant;
    this.floorValue = floorValue;
    this.source = source;
    this.startsAt = startsAt;
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

  canMoveTo(next: WeightedFrequencySlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        return next === "ready";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WeightedFrequencySlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted frequency slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.floorValue + this.startsAt) * 100) / 100;
  }

  copy(): WeightedFrequencySlot {
    return new WeightedFrequencySlot(
      this.code,
      this.title,
      this.unit,
      this.variant,
      this.floorValue,
      this.source,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a weighted frequency slot in status idle. */
export function newWeightedFrequencySlot(code: string, title: string): WeightedFrequencySlot {
  return new WeightedFrequencySlot(code, title, "", "", 0, "", 0, "idle");
}
