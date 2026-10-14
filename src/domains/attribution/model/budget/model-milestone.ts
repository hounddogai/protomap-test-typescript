import * as text from "../../../../kit/text.js";

/** Where a model milestone is in its life cycle. */
export type ModelMilestoneStatus = "created" | "validated" | "published" | "retired";

/** One model milestone, with what the planners need to act on it. */
export class ModelMilestone {
  code: string;
  name: string;
  category: string;
  bid: number;
  locale: string;
  reviewer: string;
  budget: number;
  source: string;
  status: ModelMilestoneStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    bid: number,
    locale: string,
    reviewer: string,
    budget: number,
    source: string,
    status: ModelMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.bid = bid;
    this.locale = locale;
    this.reviewer = reviewer;
    this.budget = budget;
    this.source = source;
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

  canMoveTo(next: ModelMilestoneStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ModelMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.budget - this.bid) * 100) / 100;
  }

  copy(): ModelMilestone {
    return new ModelMilestone(
      this.code,
      this.name,
      this.category,
      this.bid,
      this.locale,
      this.reviewer,
      this.budget,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a model milestone in status created. */
export function newModelMilestone(code: string, name: string): ModelMilestone {
  return new ModelMilestone(code, name, "", 0, "", "", 0, "", "created");
}
