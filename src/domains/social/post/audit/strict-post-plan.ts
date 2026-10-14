import * as text from "../../../../kit/text.js";

/** Where a strict post plan is in its life cycle. */
export type StrictPostPlanStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a strict post plan and its current status. */
export class StrictPostPlan {
  code: string;
  name: string;
  active: boolean;
  maximum: number;
  reviewer: string;
  country: string;
  description: string;
  notes: string;
  status: StrictPostPlanStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    maximum: number,
    reviewer: string,
    country: string,
    description: string,
    notes: string,
    status: StrictPostPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.maximum = maximum;
    this.reviewer = reviewer;
    this.country = country;
    this.description = description;
    this.notes = notes;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: StrictPostPlanStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: StrictPostPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict post plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): StrictPostPlan {
    return new StrictPostPlan(
      this.code,
      this.name,
      this.active,
      this.maximum,
      this.reviewer,
      this.country,
      this.description,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a strict post plan in status idle. */
export function newStrictPostPlan(code: string, name: string): StrictPostPlan {
  return new StrictPostPlan(code, name, false, 0, "", "", "", "", "idle");
}
