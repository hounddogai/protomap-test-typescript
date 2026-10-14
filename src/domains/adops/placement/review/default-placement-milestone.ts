import * as text from "../../../../kit/text.js";

/** Where a default placement milestone is in its life cycle. */
export type DefaultPlacementMilestoneStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default placement milestone as the placement team keeps it. */
export class DefaultPlacementMilestone {
  code: string;
  name: string;
  openRate: number;
  journeyId: string;
  approved: boolean;
  capacity: number;
  score: number;
  graceDays: number;
  quantity: number;
  unit: string;
  rate: number;
  status: DefaultPlacementMilestoneStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    journeyId: string,
    approved: boolean,
    capacity: number,
    score: number,
    graceDays: number,
    quantity: number,
    unit: string,
    rate: number,
    status: DefaultPlacementMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.journeyId = journeyId;
    this.approved = approved;
    this.capacity = capacity;
    this.score = score;
    this.graceDays = graceDays;
    this.quantity = quantity;
    this.unit = unit;
    this.rate = rate;
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

  canMoveTo(next: DefaultPlacementMilestoneStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultPlacementMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default placement milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedValue(): number {
    return Math.round((this.graceDays - this.score) * 100) / 100;
  }

  copy(): DefaultPlacementMilestone {
    return new DefaultPlacementMilestone(
      this.code,
      this.name,
      this.openRate,
      this.journeyId,
      this.approved,
      this.capacity,
      this.score,
      this.graceDays,
      this.quantity,
      this.unit,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a default placement milestone in status open. */
export function newDefaultPlacementMilestone(code: string, name: string): DefaultPlacementMilestone {
  return new DefaultPlacementMilestone(code, name, 0, "", false, 0, 0, 0, 0, "", 0, "open");
}
