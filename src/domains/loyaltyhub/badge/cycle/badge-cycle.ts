/**
 * The badge cycle records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge cycle is in its life cycle. */
export type BadgeCycleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One badge cycle, with what the planners need to act on it. */
export class BadgeCycle {
  code: string;
  label: string;
  minimum: number;
  sequence: number;
  description: string;
  timezone: string;
  region: string;
  openRate: number;
  updatedAt: number;
  source: string;
  status: BadgeCycleStatus;

  constructor(
    code: string,
    label: string,
    minimum: number,
    sequence: number,
    description: string,
    timezone: string,
    region: string,
    openRate: number,
    updatedAt: number,
    source: string,
    status: BadgeCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.minimum = minimum;
    this.sequence = sequence;
    this.description = description;
    this.timezone = timezone;
    this.region = region;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.source = source;
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

  canMoveTo(next: BadgeCycleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
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

  moveTo(next: BadgeCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round(this.updatedAt * this.openRate * 100) / 100;
  }

  copy(): BadgeCycle {
    return new BadgeCycle(
      this.code,
      this.label,
      this.minimum,
      this.sequence,
      this.description,
      this.timezone,
      this.region,
      this.openRate,
      this.updatedAt,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a badge cycle in status new. */
export function newBadgeCycle(code: string, label: string): BadgeCycle {
  return new BadgeCycle(code, label, 0, 0, "", "", "", 0, 0, "", "new");
}
