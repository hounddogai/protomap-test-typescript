import * as text from "../../../../kit/text.js";

/** Where a capped fraud check proposal is in its life cycle. */
export type CappedFraudCheckProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped fraud check proposal. Its code is unique within a tenant. */
export class CappedFraudCheckProposal {
  code: string;
  name: string;
  updatedAt: number;
  source: string;
  cohort: string;
  score: number;
  ownerId: string;
  country: string;
  description: string;
  currency: string;
  status: CappedFraudCheckProposalStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    source: string,
    cohort: string,
    score: number,
    ownerId: string,
    country: string,
    description: string,
    currency: string,
    status: CappedFraudCheckProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.source = source;
    this.cohort = cohort;
    this.score = score;
    this.ownerId = ownerId;
    this.country = country;
    this.description = description;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedFraudCheckProposalStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "failed";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CappedFraudCheckProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped fraud check proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.updatedAt - this.score) * 100) / 100;
  }

  copy(): CappedFraudCheckProposal {
    return new CappedFraudCheckProposal(
      this.code,
      this.name,
      this.updatedAt,
      this.source,
      this.cohort,
      this.score,
      this.ownerId,
      this.country,
      this.description,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a capped fraud check proposal in status new. */
export function newCappedFraudCheckProposal(code: string, name: string): CappedFraudCheckProposal {
  return new CappedFraudCheckProposal(code, name, 0, "", "", 0, "", "", "", "", "new");
}
