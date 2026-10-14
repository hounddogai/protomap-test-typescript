/**
 * The level segment records of loyaltyhub's level work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a level segment is in its life cycle. */
export type LevelSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a level segment and its current status. */
export class LevelSegment {
  code: string;
  label: string;
  sequence: number;
  ceiling: number;
  category: string;
  name: string;
  rate: number;
  country: string;
  status: LevelSegmentStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    ceiling: number,
    category: string,
    name: string,
    rate: number,
    country: string,
    status: LevelSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.ceiling = ceiling;
    this.category = category;
    this.name = name;
    this.rate = rate;
    this.country = country;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LevelSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LevelSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`level segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.rate - this.ceiling) * 100) / 100;
  }

  copy(): LevelSegment {
    return new LevelSegment(
      this.code,
      this.label,
      this.sequence,
      this.ceiling,
      this.category,
      this.name,
      this.rate,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a level segment in status open. */
export function newLevelSegment(code: string, label: string): LevelSegment {
  return new LevelSegment(code, label, 0, 0, "", "", 0, "", "open");
}
