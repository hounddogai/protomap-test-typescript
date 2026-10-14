/**
 * The badge policy records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge policy is in its life cycle. */
export type BadgePolicyStatus = "created" | "validated" | "published" | "retired";

/** One badge policy, with what the planners need to act on it. */
export class BadgePolicy {
  code: string;
  title: string;
  budget: number;
  timezone: string;
  capacity: number;
  margin: number;
  notes: string;
  summary: string;
  status: BadgePolicyStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    timezone: string,
    capacity: number,
    margin: number,
    notes: string,
    summary: string,
    status: BadgePolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.timezone = timezone;
    this.capacity = capacity;
    this.margin = margin;
    this.notes = notes;
    this.summary = summary;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BadgePolicyStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BadgePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.budget * this.capacity * 100) / 100;
  }

  copy(): BadgePolicy {
    return new BadgePolicy(
      this.code,
      this.title,
      this.budget,
      this.timezone,
      this.capacity,
      this.margin,
      this.notes,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a badge policy in status created. */
export function newBadgePolicy(code: string, title: string): BadgePolicy {
  return new BadgePolicy(code, title, 0, "", 0, 0, "", "", "created");
}
