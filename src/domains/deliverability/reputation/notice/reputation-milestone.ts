import * as text from "../../../../kit/text.js";

/** Where a reputation milestone is in its life cycle. */
export type ReputationMilestoneStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a reputation milestone and its current status. */
export class ReputationMilestone {
  code: string;
  name: string;
  weight: number;
  audienceId: string;
  journeyId: string;
  timezone: string;
  cost: number;
  ownerId: string;
  utmSource: string;
  budget: number;
  ceiling: number;
  status: ReputationMilestoneStatus;

  constructor(
    code: string,
    name: string,
    weight: number,
    audienceId: string,
    journeyId: string,
    timezone: string,
    cost: number,
    ownerId: string,
    utmSource: string,
    budget: number,
    ceiling: number,
    status: ReputationMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.weight = weight;
    this.audienceId = audienceId;
    this.journeyId = journeyId;
    this.timezone = timezone;
    this.cost = cost;
    this.ownerId = ownerId;
    this.utmSource = utmSource;
    this.budget = budget;
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

  canMoveTo(next: ReputationMilestoneStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed";
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

  moveTo(next: ReputationMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveLoad(): number {
    return Math.round(this.weight * this.cost * 100) / 100;
  }

  copy(): ReputationMilestone {
    return new ReputationMilestone(
      this.code,
      this.name,
      this.weight,
      this.audienceId,
      this.journeyId,
      this.timezone,
      this.cost,
      this.ownerId,
      this.utmSource,
      this.budget,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a reputation milestone in status planned. */
export function newReputationMilestone(code: string, name: string): ReputationMilestone {
  return new ReputationMilestone(code, name, 0, "", "", "", 0, "", "", 0, 0, "planned");
}
