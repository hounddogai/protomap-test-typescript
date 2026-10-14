import * as text from "../../../../kit/text.js";

/** Where a exit rule segment is in its life cycle. */
export type ExitRuleSegmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A exit rule segment as the exit rule team keeps it. */
export class ExitRuleSegment {
  code: string;
  title: string;
  frequencyCap: number;
  category: string;
  ceiling: number;
  status: ExitRuleSegmentStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    category: string,
    ceiling: number,
    status: ExitRuleSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.category = category;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleSegmentStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.ceiling - this.frequencyCap) * 100) / 100;
  }

  copy(): ExitRuleSegment {
    return new ExitRuleSegment(this.code, this.title, this.frequencyCap, this.category, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a exit rule segment in status planned. */
export function newExitRuleSegment(code: string, title: string): ExitRuleSegment {
  return new ExitRuleSegment(code, title, 0, "", 0, "planned");
}
