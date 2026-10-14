import * as text from "../../../../kit/text.js";

/** Where a scheduled step proposal is in its life cycle. */
export type ScheduledStepProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a scheduled step proposal and its current status. */
export class ScheduledStepProposal {
  code: string;
  title: string;
  cost: number;
  category: string;
  ratio: number;
  retries: number;
  status: ScheduledStepProposalStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    category: string,
    ratio: number,
    retries: number,
    status: ScheduledStepProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.category = category;
    this.ratio = ratio;
    this.retries = retries;
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

  canMoveTo(next: ScheduledStepProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ScheduledStepProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled step proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round((this.retries + this.ratio) * 100) / 100;
  }

  copy(): ScheduledStepProposal {
    return new ScheduledStepProposal(
      this.code,
      this.title,
      this.cost,
      this.category,
      this.ratio,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled step proposal in status planned. */
export function newScheduledStepProposal(code: string, title: string): ScheduledStepProposal {
  return new ScheduledStepProposal(code, title, 0, "", 0, 0, "planned");
}
