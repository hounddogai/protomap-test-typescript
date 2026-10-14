import * as text from "../../../../kit/text.js";

/** Where a sla cycle is in its life cycle. */
export type SlaCycleStatus = "created" | "validated" | "published" | "retired";

/** One sla cycle, with what the planners need to act on it. */
export class SlaCycle {
  code: string;
  label: string;
  budget: number;
  description: string;
  cohort: string;
  updatedAt: number;
  status: SlaCycleStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    description: string,
    cohort: string,
    updatedAt: number,
    status: SlaCycleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.description = description;
    this.cohort = cohort;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: SlaCycleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: SlaCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round((this.budget + this.updatedAt) * 100) / 100;
  }

  copy(): SlaCycle {
    return new SlaCycle(this.code, this.label, this.budget, this.description, this.cohort, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a sla cycle in status created. */
export function newSlaCycle(code: string, label: string): SlaCycle {
  return new SlaCycle(code, label, 0, "", "", 0, "created");
}
