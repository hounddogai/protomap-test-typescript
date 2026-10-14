/**
 * The fallback insight group records of social's insight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback insight group is in its life cycle. */
export type FallbackInsightGroupStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback insight group. Its code is unique within a tenant. */
export class FallbackInsightGroup {
  code: string;
  label: string;
  category: string;
  durationMinutes: number;
  cost: number;
  status: FallbackInsightGroupStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    durationMinutes: number,
    cost: number,
    status: FallbackInsightGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.durationMinutes = durationMinutes;
    this.cost = cost;
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

  canMoveTo(next: FallbackInsightGroupStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "reopened";
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
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackInsightGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback insight group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"fallback insight group"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.durationMinutes - this.cost) * 100) / 100;
  }

  copy(): FallbackInsightGroup {
    return new FallbackInsightGroup(this.code, this.label, this.category, this.durationMinutes, this.cost, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback insight group in status open. */
export function newFallbackInsightGroup(code: string, label: string): FallbackInsightGroup {
  return new FallbackInsightGroup(code, label, "", 0, 0, "open");
}
