import * as text from "../../../../kit/text.js";

/** Where a manual reputation proposal is in its life cycle. */
export type ManualReputationProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual reputation proposal and its current status. */
export class ManualReputationProposal {
  code: string;
  name: string;
  openRate: number;
  graceDays: number;
  category: string;
  status: ManualReputationProposalStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    graceDays: number,
    category: string,
    status: ManualReputationProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.graceDays = graceDays;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ManualReputationProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualReputationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual reputation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual reputation proposal"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.openRate + this.graceDays) * 100) / 100;
  }

  copy(): ManualReputationProposal {
    return new ManualReputationProposal(
      this.code,
      this.name,
      this.openRate,
      this.graceDays,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual reputation proposal in status requested. */
export function newManualReputationProposal(code: string, name: string): ManualReputationProposal {
  return new ManualReputationProposal(code, name, 0, 0, "", "requested");
}
