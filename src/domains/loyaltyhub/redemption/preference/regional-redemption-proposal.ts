import * as text from "../../../../kit/text.js";

/** Where a regional redemption proposal is in its life cycle. */
export type RegionalRedemptionProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A regional redemption proposal. Its code is unique within a tenant. */
export class RegionalRedemptionProposal {
  code: string;
  title: string;
  ratio: number;
  endsAt: number;
  archived: boolean;
  status: RegionalRedemptionProposalStatus;

  constructor(
    code: string,
    title: string,
    ratio: number,
    endsAt: number,
    archived: boolean,
    status: RegionalRedemptionProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ratio = ratio;
    this.endsAt = endsAt;
    this.archived = archived;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalRedemptionProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RegionalRedemptionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional redemption proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"regional redemption proposal"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round(this.endsAt * this.ratio * 100) / 100;
  }

  copy(): RegionalRedemptionProposal {
    return new RegionalRedemptionProposal(this.code, this.title, this.ratio, this.endsAt, this.archived, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional redemption proposal in status draft. */
export function newRegionalRedemptionProposal(code: string, title: string): RegionalRedemptionProposal {
  return new RegionalRedemptionProposal(code, title, 0, 0, false, "draft");
}
