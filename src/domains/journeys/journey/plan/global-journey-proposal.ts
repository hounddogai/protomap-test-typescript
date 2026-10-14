import * as text from "../../../../kit/text.js";

/** Where a global journey proposal is in its life cycle. */
export type GlobalJourneyProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global journey proposal as the journey team keeps it. */
export class GlobalJourneyProposal {
  code: string;
  name: string;
  batchSize: number;
  amount: number;
  externalRef: string;
  status: GlobalJourneyProposalStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    amount: number,
    externalRef: string,
    status: GlobalJourneyProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.amount = amount;
    this.externalRef = externalRef;
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

  canMoveTo(next: GlobalJourneyProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: GlobalJourneyProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global journey proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round(this.batchSize * this.amount * 100) / 100;
  }

  copy(): GlobalJourneyProposal {
    return new GlobalJourneyProposal(this.code, this.name, this.batchSize, this.amount, this.externalRef, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global journey proposal in status planned. */
export function newGlobalJourneyProposal(code: string, name: string): GlobalJourneyProposal {
  return new GlobalJourneyProposal(code, name, 0, 0, "", "planned");
}
