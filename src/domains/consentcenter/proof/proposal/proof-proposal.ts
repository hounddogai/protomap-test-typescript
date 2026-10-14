/**
 * The proof proposal records of consentcenter's proof work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof proposal is in its life cycle. */
export type ProofProposalStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A proof proposal as the proof team keeps it. */
export class ProofProposal {
  code: string;
  title: string;
  cohort: string;
  capacity: number;
  openRate: number;
  updatedAt: number;
  weight: number;
  status: ProofProposalStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    capacity: number,
    openRate: number,
    updatedAt: number,
    weight: number,
    status: ProofProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.capacity = capacity;
    this.openRate = openRate;
    this.updatedAt = updatedAt;
    this.weight = weight;
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

  canMoveTo(next: ProofProposalStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: ProofProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"proof proposal"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round((this.capacity - this.updatedAt) * 100) / 100;
  }

  copy(): ProofProposal {
    return new ProofProposal(
      this.code,
      this.title,
      this.cohort,
      this.capacity,
      this.openRate,
      this.updatedAt,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof proposal in status planned. */
export function newProofProposal(code: string, title: string): ProofProposal {
  return new ProofProposal(code, title, "", 0, 0, 0, 0, "planned");
}
