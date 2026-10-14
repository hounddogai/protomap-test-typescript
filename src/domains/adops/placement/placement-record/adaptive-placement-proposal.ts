import * as text from "../../../../kit/text.js";

/** Where a adaptive placement proposal is in its life cycle. */
export type AdaptivePlacementProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a adaptive placement proposal and its current status. */
export class AdaptivePlacementProposal {
  code: string;
  label: string;
  sequence: number;
  budget: number;
  sendAt: number;
  active: boolean;
  unit: string;
  status: AdaptivePlacementProposalStatus;

  constructor(
    code: string,
    label: string,
    sequence: number,
    budget: number,
    sendAt: number,
    active: boolean,
    unit: string,
    status: AdaptivePlacementProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sequence = sequence;
    this.budget = budget;
    this.sendAt = sendAt;
    this.active = active;
    this.unit = unit;
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

  canMoveTo(next: AdaptivePlacementProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
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

  moveTo(next: AdaptivePlacementProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive placement proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  adjustedVolume(): number {
    return Math.round((this.sequence - this.budget) * 100) / 100;
  }

  copy(): AdaptivePlacementProposal {
    return new AdaptivePlacementProposal(
      this.code,
      this.label,
      this.sequence,
      this.budget,
      this.sendAt,
      this.active,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a adaptive placement proposal in status requested. */
export function newAdaptivePlacementProposal(code: string, label: string): AdaptivePlacementProposal {
  return new AdaptivePlacementProposal(code, label, 0, 0, 0, false, "", "requested");
}
