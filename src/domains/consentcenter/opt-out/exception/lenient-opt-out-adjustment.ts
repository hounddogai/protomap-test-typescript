import * as text from "../../../../kit/text.js";

/** Where a lenient opt out adjustment is in its life cycle. */
export type LenientOptOutAdjustmentStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient opt out adjustment and its current status. */
export class LenientOptOutAdjustment {
  code: string;
  title: string;
  active: boolean;
  priority: number;
  tags: string[];
  score: number;
  ceiling: number;
  description: string;
  budget: number;
  status: LenientOptOutAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    priority: number,
    tags: string[],
    score: number,
    ceiling: number,
    description: string,
    budget: number,
    status: LenientOptOutAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.priority = priority;
    this.tags = tags;
    this.score = score;
    this.ceiling = ceiling;
    this.description = description;
    this.budget = budget;
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

  canMoveTo(next: LenientOptOutAdjustmentStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
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

  moveTo(next: LenientOptOutAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient opt out adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.ceiling - this.score) * 100) / 100;
  }

  copy(): LenientOptOutAdjustment {
    return new LenientOptOutAdjustment(
      this.code,
      this.title,
      this.active,
      this.priority,
      this.tags,
      this.score,
      this.ceiling,
      this.description,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a lenient opt out adjustment in status planned. */
export function newLenientOptOutAdjustment(code: string, title: string): LenientOptOutAdjustment {
  return new LenientOptOutAdjustment(code, title, false, 0, [], 0, 0, "", 0, "planned");
}
