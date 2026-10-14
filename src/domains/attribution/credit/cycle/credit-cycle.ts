/**
 * The credit cycle records of attribution's credit work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit cycle is in its life cycle. */
export type CreditCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a credit cycle and its current status. */
export class CreditCycle {
  code: string;
  name: string;
  bid: number;
  channel: string;
  tags: string[];
  status: CreditCycleStatus;

  constructor(code: string, name: string, bid: number, channel: string, tags: string[], status: CreditCycleStatus) {
    this.code = code;
    this.name = name;
    this.bid = bid;
    this.channel = channel;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreditCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): CreditCycle {
    return new CreditCycle(this.code, this.name, this.bid, this.channel, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a credit cycle in status planned. */
export function newCreditCycle(code: string, name: string): CreditCycle {
  return new CreditCycle(code, name, 0, "", [], "planned");
}
