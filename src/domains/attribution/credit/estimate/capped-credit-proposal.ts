import * as text from "../../../../kit/text.js";

/** Where a capped credit proposal is in its life cycle. */
export type CappedCreditProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One capped credit proposal, with what the planners need to act on it. */
export class CappedCreditProposal {
  code: string;
  name: string;
  version: number;
  active: boolean;
  reviewer: string;
  status: CappedCreditProposalStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    active: boolean,
    reviewer: string,
    status: CappedCreditProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.active = active;
    this.reviewer = reviewer;
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

  canMoveTo(next: CappedCreditProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        return next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedCreditProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped credit proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"capped credit proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.version;
  }

  copy(): CappedCreditProposal {
    return new CappedCreditProposal(this.code, this.name, this.version, this.active, this.reviewer, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped credit proposal in status planned. */
export function newCappedCreditProposal(code: string, name: string): CappedCreditProposal {
  return new CappedCreditProposal(code, name, 0, false, "", "planned");
}
