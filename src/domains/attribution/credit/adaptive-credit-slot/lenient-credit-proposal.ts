import * as text from "../../../../kit/text.js";

/** Where a lenient credit proposal is in its life cycle. */
export type LenientCreditProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a lenient credit proposal and its current status. */
export class LenientCreditProposal {
  code: string;
  title: string;
  frequencyCap: number;
  cohort: string;
  openRate: number;
  segment: string;
  category: string;
  amount: number;
  status: LenientCreditProposalStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    cohort: string,
    openRate: number,
    segment: string,
    category: string,
    amount: number,
    status: LenientCreditProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.cohort = cohort;
    this.openRate = openRate;
    this.segment = segment;
    this.category = category;
    this.amount = amount;
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

  canMoveTo(next: LenientCreditProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        switch (next) {
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

  moveTo(next: LenientCreditProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient credit proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round(this.frequencyCap * this.amount * 100) / 100;
  }

  copy(): LenientCreditProposal {
    return new LenientCreditProposal(
      this.code,
      this.title,
      this.frequencyCap,
      this.cohort,
      this.openRate,
      this.segment,
      this.category,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient credit proposal in status planned. */
export function newLenientCreditProposal(code: string, title: string): LenientCreditProposal {
  return new LenientCreditProposal(code, title, 0, "", 0, "", "", 0, "planned");
}
