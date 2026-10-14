/**
 * The rolling journey target records of journeys's journey work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling journey target is in its life cycle. */
export type RollingJourneyTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One rolling journey target, with what the planners need to act on it. */
export class RollingJourneyTarget {
  code: string;
  title: string;
  minimum: number;
  country: string;
  threshold: number;
  label: string;
  retries: number;
  floorValue: number;
  source: string;
  region: string;
  capacity: number;
  status: RollingJourneyTargetStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    country: string,
    threshold: number,
    label: string,
    retries: number,
    floorValue: number,
    source: string,
    region: string,
    capacity: number,
    status: RollingJourneyTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.country = country;
    this.threshold = threshold;
    this.label = label;
    this.retries = retries;
    this.floorValue = floorValue;
    this.source = source;
    this.region = region;
    this.capacity = capacity;
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

  canMoveTo(next: RollingJourneyTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "suspended";
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RollingJourneyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling journey target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedTotal(): number {
    return Math.round((this.retries - this.floorValue) * 100) / 100;
  }

  copy(): RollingJourneyTarget {
    return new RollingJourneyTarget(
      this.code,
      this.title,
      this.minimum,
      this.country,
      this.threshold,
      this.label,
      this.retries,
      this.floorValue,
      this.source,
      this.region,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a rolling journey target in status draft. */
export function newRollingJourneyTarget(code: string, title: string): RollingJourneyTarget {
  return new RollingJourneyTarget(code, title, 0, "", 0, "", 0, 0, "", "", 0, "draft");
}
