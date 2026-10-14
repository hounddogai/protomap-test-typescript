/**
 * The adaptive sender proposal records of deliverability's sender work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive sender proposal is in its life cycle. */
export type AdaptiveSenderProposalStatus = "created" | "validated" | "published" | "retired";

/** A adaptive sender proposal. Its code is unique within a tenant. */
export class AdaptiveSenderProposal {
  code: string;
  label: string;
  category: string;
  score: number;
  summary: string;
  status: AdaptiveSenderProposalStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    score: number,
    summary: string,
    status: AdaptiveSenderProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.score = score;
    this.summary = summary;
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

  canMoveTo(next: AdaptiveSenderProposalStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
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
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSenderProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sender proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"adaptive sender proposal"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): AdaptiveSenderProposal {
    return new AdaptiveSenderProposal(this.code, this.label, this.category, this.score, this.summary, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a adaptive sender proposal in status created. */
export function newAdaptiveSenderProposal(code: string, label: string): AdaptiveSenderProposal {
  return new AdaptiveSenderProposal(code, label, "", 0, "", "created");
}
