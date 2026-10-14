import * as text from "../../../../kit/text.js";

/** Where a streak schedule is in its life cycle. */
export type StreakScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One streak schedule, with what the planners need to act on it. */
export class StreakSchedule {
  code: string;
  label: string;
  journeyId: string;
  tags: string[];
  weight: number;
  ceiling: number;
  status: StreakScheduleStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    tags: string[],
    weight: number,
    ceiling: number,
    status: StreakScheduleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.tags = tags;
    this.weight = weight;
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

  canMoveTo(next: StreakScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StreakScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`streak schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"streak schedule"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedLoad(): number {
    return Math.round((this.weight - this.ceiling) * 100) / 100;
  }

  copy(): StreakSchedule {
    return new StreakSchedule(this.code, this.label, this.journeyId, this.tags, this.weight, this.ceiling, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a streak schedule in status planned. */
export function newStreakSchedule(code: string, label: string): StreakSchedule {
  return new StreakSchedule(code, label, "", [], 0, 0, "planned");
}
