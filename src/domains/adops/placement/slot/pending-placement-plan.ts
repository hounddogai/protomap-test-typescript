import * as text from "../../../../kit/text.js";

/** Where a pending placement plan is in its life cycle. */
export type PendingPlacementPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A pending placement plan as the placement team keeps it. */
export class PendingPlacementPlan {
  code: string;
  title: string;
  attempts: number;
  quantity: number;
  active: boolean;
  updatedAt: number;
  capacity: number;
  region: string;
  name: string;
  cohort: string;
  status: PendingPlacementPlanStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    quantity: number,
    active: boolean,
    updatedAt: number,
    capacity: number,
    region: string,
    name: string,
    cohort: string,
    status: PendingPlacementPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.quantity = quantity;
    this.active = active;
    this.updatedAt = updatedAt;
    this.capacity = capacity;
    this.region = region;
    this.name = name;
    this.cohort = cohort;
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

  canMoveTo(next: PendingPlacementPlanStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PendingPlacementPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending placement plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedValue(): number {
    return Math.round(this.updatedAt * this.attempts * 100) / 100;
  }

  copy(): PendingPlacementPlan {
    return new PendingPlacementPlan(
      this.code,
      this.title,
      this.attempts,
      this.quantity,
      this.active,
      this.updatedAt,
      this.capacity,
      this.region,
      this.name,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a pending placement plan in status open. */
export function newPendingPlacementPlan(code: string, title: string): PendingPlacementPlan {
  return new PendingPlacementPlan(code, title, 0, 0, false, 0, 0, "", "", "", "open");
}
