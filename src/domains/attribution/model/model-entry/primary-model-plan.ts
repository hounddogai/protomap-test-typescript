import * as text from "../../../../kit/text.js";

/** Where a primary model plan is in its life cycle. */
export type PrimaryModelPlanStatus = "created" | "validated" | "published" | "retired";

/** A primary model plan as the model team keeps it. */
export class PrimaryModelPlan {
  code: string;
  label: string;
  category: string;
  description: string;
  budget: number;
  status: PrimaryModelPlanStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    description: string,
    budget: number,
    status: PrimaryModelPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.description = description;
    this.budget = budget;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryModelPlanStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryModelPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary model plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): PrimaryModelPlan {
    return new PrimaryModelPlan(this.code, this.label, this.category, this.description, this.budget, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary model plan in status created. */
export function newPrimaryModelPlan(code: string, label: string): PrimaryModelPlan {
  return new PrimaryModelPlan(code, label, "", "", 0, "created");
}
