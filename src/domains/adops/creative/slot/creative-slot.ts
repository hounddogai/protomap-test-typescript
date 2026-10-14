/**
 * The creative slot records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative slot is in its life cycle. */
export type CreativeSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A creative slot as the creative team keeps it. */
export class CreativeSlot {
  code: string;
  label: string;
  durationMinutes: number;
  priority: number;
  region: string;
  maximum: number;
  campaignRef: string;
  status: CreativeSlotStatus;

  constructor(
    code: string,
    label: string,
    durationMinutes: number,
    priority: number,
    region: string,
    maximum: number,
    campaignRef: string,
    status: CreativeSlotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.region = region;
    this.maximum = maximum;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: CreativeSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CreativeSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round(this.priority * this.durationMinutes * 100) / 100;
  }

  copy(): CreativeSlot {
    return new CreativeSlot(
      this.code,
      this.label,
      this.durationMinutes,
      this.priority,
      this.region,
      this.maximum,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a creative slot in status idle. */
export function newCreativeSlot(code: string, label: string): CreativeSlot {
  return new CreativeSlot(code, label, 0, 0, "", 0, "", "idle");
}
