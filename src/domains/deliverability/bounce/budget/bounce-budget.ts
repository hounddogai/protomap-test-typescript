/**
 * The bounce budget records of deliverability's bounce work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a bounce budget is in its life cycle. */
export type BounceBudgetStatus = "new" | "queued" | "running" | "done" | "failed";

/** A bounce budget. Its code is unique within a tenant. */
export class BounceBudget {
  code: string;
  name: string;
  channel: string;
  capacity: number;
  journeyId: string;
  status: BounceBudgetStatus;

  constructor(
    code: string,
    name: string,
    channel: string,
    capacity: number,
    journeyId: string,
    status: BounceBudgetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.channel = channel;
    this.capacity = capacity;
    this.journeyId = journeyId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: BounceBudgetStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceBudgetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce budget ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): BounceBudget {
    return new BounceBudget(this.code, this.name, this.channel, this.capacity, this.journeyId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a bounce budget in status new. */
export function newBounceBudget(code: string, name: string): BounceBudget {
  return new BounceBudget(code, name, "", 0, "", "new");
}
