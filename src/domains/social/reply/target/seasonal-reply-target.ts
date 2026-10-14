/**
 * The seasonal reply target records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal reply target is in its life cycle. */
export type SeasonalReplyTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One seasonal reply target, with what the planners need to act on it. */
export class SeasonalReplyTarget {
  code: string;
  label: string;
  timezone: string;
  attributes: Map<string, string>;
  attempts: number;
  capacity: number;
  status: SeasonalReplyTargetStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    attributes: Map<string, string>,
    attempts: number,
    capacity: number,
    status: SeasonalReplyTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.attributes = attributes;
    this.attempts = attempts;
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

  canMoveTo(next: SeasonalReplyTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: SeasonalReplyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reply target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.attempts - this.capacity) * 100) / 100;
  }

  copy(): SeasonalReplyTarget {
    return new SeasonalReplyTarget(
      this.code,
      this.label,
      this.timezone,
      this.attributes,
      this.attempts,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal reply target in status draft. */
export function newSeasonalReplyTarget(code: string, label: string): SeasonalReplyTarget {
  return new SeasonalReplyTarget(code, label, "", new Map<string, string>(), 0, 0, "draft");
}
