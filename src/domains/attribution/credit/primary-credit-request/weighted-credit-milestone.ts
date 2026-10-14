import * as text from "../../../../kit/text.js";

/** Where a weighted credit milestone is in its life cycle. */
export type WeightedCreditMilestoneStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a weighted credit milestone and its current status. */
export class WeightedCreditMilestone {
  code: string;
  label: string;
  limit: number;
  ownerId: string;
  startsAt: number;
  region: string;
  priority: number;
  status: WeightedCreditMilestoneStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    ownerId: string,
    startsAt: number,
    region: string,
    priority: number,
    status: WeightedCreditMilestoneStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.ownerId = ownerId;
    this.startsAt = startsAt;
    this.region = region;
    this.priority = priority;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedCreditMilestoneStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedCreditMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted credit milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedVolume(): number {
    return Math.round((this.startsAt + this.priority) * 100) / 100;
  }

  copy(): WeightedCreditMilestone {
    return new WeightedCreditMilestone(
      this.code,
      this.label,
      this.limit,
      this.ownerId,
      this.startsAt,
      this.region,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted credit milestone in status new. */
export function newWeightedCreditMilestone(code: string, label: string): WeightedCreditMilestone {
  return new WeightedCreditMilestone(code, label, 0, "", 0, "", 0, "new");
}
