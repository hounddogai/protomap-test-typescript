import * as text from "../../../../kit/text.js";

/** Where a primary wait milestone is in its life cycle. */
export type PrimaryWaitMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a primary wait milestone and its current status. */
export class PrimaryWaitMilestone {
  code: string;
  name: string;
  variant: string;
  archived: boolean;
  country: string;
  score: number;
  status: PrimaryWaitMilestoneStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    archived: boolean,
    country: string,
    score: number,
    status: PrimaryWaitMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.archived = archived;
    this.country = country;
    this.score = score;
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

  canMoveTo(next: PrimaryWaitMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: PrimaryWaitMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary wait milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): PrimaryWaitMilestone {
    return new PrimaryWaitMilestone(
      this.code,
      this.name,
      this.variant,
      this.archived,
      this.country,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary wait milestone in status planned. */
export function newPrimaryWaitMilestone(code: string, name: string): PrimaryWaitMilestone {
  return new PrimaryWaitMilestone(code, name, "", false, "", 0, "planned");
}
