/**
 * The adaptive creative cycle records of adops's creative work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive creative cycle is in its life cycle. */
export type AdaptiveCreativeCycleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive creative cycle as the creative team keeps it. */
export class AdaptiveCreativeCycle {
  code: string;
  name: string;
  limit: number;
  segment: string;
  sequence: number;
  sendAt: number;
  timezone: string;
  externalRef: string;
  pinned: boolean;
  status: AdaptiveCreativeCycleStatus;

  constructor(
    code: string,
    name: string,
    limit: number,
    segment: string,
    sequence: number,
    sendAt: number,
    timezone: string,
    externalRef: string,
    pinned: boolean,
    status: AdaptiveCreativeCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.limit = limit;
    this.segment = segment;
    this.sequence = sequence;
    this.sendAt = sendAt;
    this.timezone = timezone;
    this.externalRef = externalRef;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveCreativeCycleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveCreativeCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive creative cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netTotal(): number {
    return Math.round((this.sequence - this.limit) * 100) / 100;
  }

  copy(): AdaptiveCreativeCycle {
    return new AdaptiveCreativeCycle(
      this.code,
      this.name,
      this.limit,
      this.segment,
      this.sequence,
      this.sendAt,
      this.timezone,
      this.externalRef,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a adaptive creative cycle in status draft. */
export function newAdaptiveCreativeCycle(code: string, name: string): AdaptiveCreativeCycle {
  return new AdaptiveCreativeCycle(code, name, 0, "", 0, 0, "", "", false, "draft");
}
