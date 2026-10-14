import * as text from "../../../../kit/text.js";

/** Where a reputation cycle is in its life cycle. */
export type ReputationCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A reputation cycle as the reputation team keeps it. */
export class ReputationCycle {
  code: string;
  title: string;
  summary: string;
  ratio: number;
  archived: boolean;
  batchSize: number;
  budget: number;
  minimum: number;
  status: ReputationCycleStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    ratio: number,
    archived: boolean,
    batchSize: number,
    budget: number,
    minimum: number,
    status: ReputationCycleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.ratio = ratio;
    this.archived = archived;
    this.batchSize = batchSize;
    this.budget = budget;
    this.minimum = minimum;
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

  canMoveTo(next: ReputationCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ReputationCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round((this.ratio - this.batchSize) * 100) / 100;
  }

  copy(): ReputationCycle {
    return new ReputationCycle(
      this.code,
      this.title,
      this.summary,
      this.ratio,
      this.archived,
      this.batchSize,
      this.budget,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reputation cycle in status planned. */
export function newReputationCycle(code: string, title: string): ReputationCycle {
  return new ReputationCycle(code, title, "", 0, false, 0, 0, 0, "planned");
}
