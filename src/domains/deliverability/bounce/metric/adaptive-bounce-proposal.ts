import * as text from "../../../../kit/text.js";

/** Where a adaptive bounce proposal is in its life cycle. */
export type AdaptiveBounceProposalStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive bounce proposal and its current status. */
export class AdaptiveBounceProposal {
  code: string;
  title: string;
  budget: number;
  utmSource: string;
  retries: number;
  limit: number;
  status: AdaptiveBounceProposalStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    utmSource: string,
    retries: number,
    limit: number,
    status: AdaptiveBounceProposalStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.utmSource = utmSource;
    this.retries = retries;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveBounceProposalStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveBounceProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive bounce proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.limit - this.retries) * 100) / 100;
  }

  copy(): AdaptiveBounceProposal {
    return new AdaptiveBounceProposal(
      this.code,
      this.title,
      this.budget,
      this.utmSource,
      this.retries,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a adaptive bounce proposal in status proposed. */
export function newAdaptiveBounceProposal(code: string, title: string): AdaptiveBounceProposal {
  return new AdaptiveBounceProposal(code, title, 0, "", 0, 0, "proposed");
}
