/**
 * The journey baseline records of journeys's journey work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey baseline is in its life cycle. */
export type JourneyBaselineStatus = "new" | "queued" | "running" | "done" | "failed";

/** One journey baseline, with what the planners need to act on it. */
export class JourneyBaseline {
  code: string;
  title: string;
  source: string;
  startsAt: number;
  archived: boolean;
  frequencyCap: number;
  limit: number;
  cost: number;
  minimum: number;
  name: string;
  variant: string;
  status: JourneyBaselineStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    startsAt: number,
    archived: boolean,
    frequencyCap: number,
    limit: number,
    cost: number,
    minimum: number,
    name: string,
    variant: string,
    status: JourneyBaselineStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.startsAt = startsAt;
    this.archived = archived;
    this.frequencyCap = frequencyCap;
    this.limit = limit;
    this.cost = cost;
    this.minimum = minimum;
    this.name = name;
    this.variant = variant;
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

  canMoveTo(next: JourneyBaselineStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: JourneyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netValue(): number {
    return Math.round(this.cost * this.limit * 100) / 100;
  }

  copy(): JourneyBaseline {
    return new JourneyBaseline(
      this.code,
      this.title,
      this.source,
      this.startsAt,
      this.archived,
      this.frequencyCap,
      this.limit,
      this.cost,
      this.minimum,
      this.name,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a journey baseline in status new. */
export function newJourneyBaseline(code: string, title: string): JourneyBaseline {
  return new JourneyBaseline(code, title, "", 0, false, 0, 0, 0, 0, "", "", "new");
}
