/**
 * The placement plan records of adops's placement work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a placement plan is in its life cycle. */
export type PlacementPlanStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a placement plan and its current status. */
export class PlacementPlan {
  code: string;
  name: string;
  locale: string;
  channel: string;
  updatedAt: number;
  status: PlacementPlanStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    channel: string,
    updatedAt: number,
    status: PlacementPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.channel = channel;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: PlacementPlanStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "failed";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): PlacementPlan {
    return new PlacementPlan(this.code, this.name, this.locale, this.channel, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement plan in status new. */
export function newPlacementPlan(code: string, name: string): PlacementPlan {
  return new PlacementPlan(code, name, "", "", 0, "new");
}
