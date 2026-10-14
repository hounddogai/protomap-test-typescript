import * as text from "../../../../kit/text.js";

/** Where a macro schedule is in its life cycle. */
export type MacroScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a macro schedule and its current status. */
export class MacroSchedule {
  code: string;
  title: string;
  bid: number;
  tags: string[];
  reviewer: string;
  visible: boolean;
  country: string;
  priority: number;
  retries: number;
  ceiling: number;
  externalRef: string;
  status: MacroScheduleStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    tags: string[],
    reviewer: string,
    visible: boolean,
    country: string,
    priority: number,
    retries: number,
    ceiling: number,
    externalRef: string,
    status: MacroScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.tags = tags;
    this.reviewer = reviewer;
    this.visible = visible;
    this.country = country;
    this.priority = priority;
    this.retries = retries;
    this.ceiling = ceiling;
    this.externalRef = externalRef;
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

  canMoveTo(next: MacroScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
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

  moveTo(next: MacroScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"macro schedule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveValue(): number {
    return Math.round((this.priority - this.bid) * 100) / 100;
  }

  copy(): MacroSchedule {
    return new MacroSchedule(
      this.code,
      this.title,
      this.bid,
      this.tags,
      this.reviewer,
      this.visible,
      this.country,
      this.priority,
      this.retries,
      this.ceiling,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a macro schedule in status planned. */
export function newMacroSchedule(code: string, title: string): MacroSchedule {
  return new MacroSchedule(code, title, 0, [], "", false, "", 0, 0, 0, "", "planned");
}
