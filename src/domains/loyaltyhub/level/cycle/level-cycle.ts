/**
 * The level cycle records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level cycle is in its life cycle. */
export type LevelCycleStatus = "requested" | "granted" | "revoked" | "expired";

/** One level cycle, with what the planners need to act on it. */
export class LevelCycle {
  code: string;
  name: string;
  pinned: boolean;
  cost: number;
  quantity: number;
  label: string;
  graceDays: number;
  channel: string;
  externalRef: string;
  status: LevelCycleStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    cost: number,
    quantity: number,
    label: string,
    graceDays: number,
    channel: string,
    externalRef: string,
    status: LevelCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.cost = cost;
    this.quantity = quantity;
    this.label = label;
    this.graceDays = graceDays;
    this.channel = channel;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelCycleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round((this.quantity + this.graceDays) * 100) / 100;
  }

  copy(): LevelCycle {
    return new LevelCycle(
      this.code,
      this.name,
      this.pinned,
      this.cost,
      this.quantity,
      this.label,
      this.graceDays,
      this.channel,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a level cycle in status requested. */
export function newLevelCycle(code: string, name: string): LevelCycle {
  return new LevelCycle(code, name, false, 0, 0, "", 0, "", "", "requested");
}
