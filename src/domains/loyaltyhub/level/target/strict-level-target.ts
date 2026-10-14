/**
 * The strict level target records of loyaltyhub's level work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict level target is in its life cycle. */
export type StrictLevelTargetStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A strict level target. Its code is unique within a tenant. */
export class StrictLevelTarget {
  code: string;
  title: string;
  sendAt: number;
  createdAt: number;
  floorValue: number;
  threshold: number;
  rate: number;
  status: StrictLevelTargetStatus;

  constructor(
    code: string,
    title: string,
    sendAt: number,
    createdAt: number,
    floorValue: number,
    threshold: number,
    rate: number,
    status: StrictLevelTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.sendAt = sendAt;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.threshold = threshold;
    this.rate = rate;
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

  canMoveTo(next: StrictLevelTargetStatus): boolean {
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
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictLevelTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict level target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"strict level target"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.createdAt + this.threshold) * 100) / 100;
  }

  copy(): StrictLevelTarget {
    return new StrictLevelTarget(
      this.code,
      this.title,
      this.sendAt,
      this.createdAt,
      this.floorValue,
      this.threshold,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a strict level target in status idle. */
export function newStrictLevelTarget(code: string, title: string): StrictLevelTarget {
  return new StrictLevelTarget(code, title, 0, 0, 0, 0, 0, "idle");
}
