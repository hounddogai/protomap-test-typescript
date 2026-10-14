import * as text from "../../../../kit/text.js";

/** Where a preference proposal is in its life cycle. */
export type PreferenceProposalStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One preference proposal, with what the planners need to act on it. */
export class PreferenceProposal {
  code: string;
  name: string;
  ratio: number;
  discount: number;
  score: number;
  expiresAt: number;
  approved: boolean;
  status: PreferenceProposalStatus;

  constructor(
    code: string,
    name: string,
    ratio: number,
    discount: number,
    score: number,
    expiresAt: number,
    approved: boolean,
    status: PreferenceProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ratio = ratio;
    this.discount = discount;
    this.score = score;
    this.expiresAt = expiresAt;
    this.approved = approved;
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

  canMoveTo(next: PreferenceProposalStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PreferenceProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`preference proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round(this.expiresAt * this.discount * 100) / 100;
  }

  copy(): PreferenceProposal {
    return new PreferenceProposal(
      this.code,
      this.name,
      this.ratio,
      this.discount,
      this.score,
      this.expiresAt,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a preference proposal in status draft. */
export function newPreferenceProposal(code: string, name: string): PreferenceProposal {
  return new PreferenceProposal(code, name, 0, 0, 0, 0, false, "draft");
}
