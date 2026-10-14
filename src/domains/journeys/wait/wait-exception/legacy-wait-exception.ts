/**
 * The legacy wait exception records of journeys's wait work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy wait exception is in its life cycle. */
export type LegacyWaitExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy wait exception as the wait team keeps it. */
export class LegacyWaitException {
  code: string;
  name: string;
  tags: string[];
  sequence: number;
  country: string;
  quantity: number;
  updatedAt: number;
  label: string;
  status: LegacyWaitExceptionStatus;

  constructor(
    code: string,
    name: string,
    tags: string[],
    sequence: number,
    country: string,
    quantity: number,
    updatedAt: number,
    label: string,
    status: LegacyWaitExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.tags = tags;
    this.sequence = sequence;
    this.country = country;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.label = label;
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

  canMoveTo(next: LegacyWaitExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyWaitExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy wait exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy wait exception"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedTotal(): number {
    return Math.round(this.sequence * this.quantity * 100) / 100;
  }

  copy(): LegacyWaitException {
    return new LegacyWaitException(
      this.code,
      this.name,
      this.tags,
      this.sequence,
      this.country,
      this.quantity,
      this.updatedAt,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy wait exception in status idle. */
export function newLegacyWaitException(code: string, name: string): LegacyWaitException {
  return new LegacyWaitException(code, name, [], 0, "", 0, 0, "", "idle");
}
