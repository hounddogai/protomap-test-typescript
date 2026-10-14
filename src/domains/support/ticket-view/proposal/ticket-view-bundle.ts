import * as text from "../../../../kit/text.js";

/** Where a ticket view bundle is in its life cycle. */
export type TicketViewBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a ticket view bundle and its current status. */
export class TicketViewBundle {
  code: string;
  name: string;
  unit: string;
  score: number;
  region: string;
  capacity: number;
  windowDays: number;
  weight: number;
  budget: number;
  journeyId: string;
  status: TicketViewBundleStatus;

  constructor(
    code: string,
    name: string,
    unit: string,
    score: number,
    region: string,
    capacity: number,
    windowDays: number,
    weight: number,
    budget: number,
    journeyId: string,
    status: TicketViewBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.unit = unit;
    this.score = score;
    this.region = region;
    this.capacity = capacity;
    this.windowDays = windowDays;
    this.weight = weight;
    this.budget = budget;
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

  canMoveTo(next: TicketViewBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: TicketViewBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`ticket view bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"ticket view bundle"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round((this.capacity - this.budget) * 100) / 100;
  }

  copy(): TicketViewBundle {
    return new TicketViewBundle(
      this.code,
      this.name,
      this.unit,
      this.score,
      this.region,
      this.capacity,
      this.windowDays,
      this.weight,
      this.budget,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a ticket view bundle in status new. */
export function newTicketViewBundle(code: string, name: string): TicketViewBundle {
  return new TicketViewBundle(code, name, "", 0, "", 0, 0, 0, 0, "", "new");
}
