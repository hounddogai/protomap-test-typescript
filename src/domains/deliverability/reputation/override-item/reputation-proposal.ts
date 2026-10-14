import * as text from "../../../../kit/text.js";

/** Where a reputation proposal is in its life cycle. */
export type ReputationProposalStatus = "created" | "validated" | "published" | "retired";

/** One reputation proposal, with what the planners need to act on it. */
export class ReputationProposal {
  code: string;
  label: string;
  discount: number;
  campaignRef: string;
  minimum: number;
  visible: boolean;
  openRate: number;
  endsAt: number;
  approved: boolean;
  ceiling: number;
  status: ReputationProposalStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    campaignRef: string,
    minimum: number,
    visible: boolean,
    openRate: number,
    endsAt: number,
    approved: boolean,
    ceiling: number,
    status: ReputationProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.campaignRef = campaignRef;
    this.minimum = minimum;
    this.visible = visible;
    this.openRate = openRate;
    this.endsAt = endsAt;
    this.approved = approved;
    this.ceiling = ceiling;
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

  canMoveTo(next: ReputationProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedValue(): number {
    return Math.round(this.ceiling * this.minimum * 100) / 100;
  }

  copy(): ReputationProposal {
    return new ReputationProposal(
      this.code,
      this.label,
      this.discount,
      this.campaignRef,
      this.minimum,
      this.visible,
      this.openRate,
      this.endsAt,
      this.approved,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation proposal in status created. */
export function newReputationProposal(code: string, label: string): ReputationProposal {
  return new ReputationProposal(code, label, 0, "", 0, false, 0, 0, false, 0, "created");
}
