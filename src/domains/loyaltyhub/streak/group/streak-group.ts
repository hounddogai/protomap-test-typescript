/**
 * The streak group records of loyaltyhub's streak work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a streak group is in its life cycle. */
export type StreakGroupStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a streak group and its current status. */
export class StreakGroup {
  code: string;
  title: string;
  variant: string;
  reviewer: string;
  minimum: number;
  region: string;
  notes: string;
  phone: string;
  status: StreakGroupStatus;

  constructor(
    code: string,
    title: string,
    variant: string,
    reviewer: string,
    minimum: number,
    region: string,
    notes: string,
    phone: string,
    status: StreakGroupStatus,
  ) {
    this.code = code;
    this.title = title;
    this.variant = variant;
    this.reviewer = reviewer;
    this.minimum = minimum;
    this.region = region;
    this.notes = notes;
    this.phone = phone;
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

  canMoveTo(next: StreakGroupStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
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

  moveTo(next: StreakGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"streak group"} ${this.code}`;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): StreakGroup {
    return new StreakGroup(
      this.code,
      this.title,
      this.variant,
      this.reviewer,
      this.minimum,
      this.region,
      this.notes,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a streak group in status new. */
export function newStreakGroup(code: string, title: string): StreakGroup {
  return new StreakGroup(code, title, "", "", 0, "", "", "", "new");
}
