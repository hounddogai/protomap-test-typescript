import * as text from "../../../../kit/text.js";

/** Where a challenge milestone is in its life cycle. */
export type ChallengeMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A challenge milestone. Its code is unique within a tenant. */
export class ChallengeMilestone {
  code: string;
  name: string;
  timezone: string;
  threshold: number;
  variant: string;
  budget: number;
  updatedAt: number;
  startsAt: number;
  sequence: number;
  unit: string;
  status: ChallengeMilestoneStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    threshold: number,
    variant: string,
    budget: number,
    updatedAt: number,
    startsAt: number,
    sequence: number,
    unit: string,
    status: ChallengeMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.threshold = threshold;
    this.variant = variant;
    this.budget = budget;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.sequence = sequence;
    this.unit = unit;
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

  canMoveTo(next: ChallengeMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ChallengeMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`challenge milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"challenge milestone"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.updatedAt + this.threshold) * 100) / 100;
  }

  copy(): ChallengeMilestone {
    return new ChallengeMilestone(
      this.code,
      this.name,
      this.timezone,
      this.threshold,
      this.variant,
      this.budget,
      this.updatedAt,
      this.startsAt,
      this.sequence,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a challenge milestone in status planned. */
export function newChallengeMilestone(code: string, name: string): ChallengeMilestone {
  return new ChallengeMilestone(code, name, "", 0, "", 0, 0, 0, 0, "", "planned");
}
