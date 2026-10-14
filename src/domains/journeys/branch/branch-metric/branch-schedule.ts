import * as text from "../../../../kit/text.js";

/** Where a branch schedule is in its life cycle. */
export type BranchScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One branch schedule, with what the planners need to act on it. */
export class BranchSchedule {
  code: string;
  title: string;
  endsAt: number;
  budget: number;
  capacity: number;
  visible: boolean;
  revision: number;
  reviewer: string;
  approved: boolean;
  ceiling: number;
  retries: number;
  status: BranchScheduleStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    budget: number,
    capacity: number,
    visible: boolean,
    revision: number,
    reviewer: string,
    approved: boolean,
    ceiling: number,
    retries: number,
    status: BranchScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.budget = budget;
    this.capacity = capacity;
    this.visible = visible;
    this.revision = revision;
    this.reviewer = reviewer;
    this.approved = approved;
    this.ceiling = ceiling;
    this.retries = retries;
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

  canMoveTo(next: BranchScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"branch schedule"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.capacity - this.retries) * 100) / 100;
  }

  copy(): BranchSchedule {
    return new BranchSchedule(
      this.code,
      this.title,
      this.endsAt,
      this.budget,
      this.capacity,
      this.visible,
      this.revision,
      this.reviewer,
      this.approved,
      this.ceiling,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a branch schedule in status planned. */
export function newBranchSchedule(code: string, title: string): BranchSchedule {
  return new BranchSchedule(code, title, 0, 0, 0, false, 0, "", false, 0, 0, "planned");
}
