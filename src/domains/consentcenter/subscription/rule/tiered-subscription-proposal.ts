import * as text from "../../../../kit/text.js";

/** Where a tiered subscription proposal is in its life cycle. */
export type TieredSubscriptionProposalStatus = "created" | "validated" | "published" | "retired";

/** The record of a tiered subscription proposal and its current status. */
export class TieredSubscriptionProposal {
  code: string;
  name: string;
  variant: string;
  rate: number;
  expiresAt: number;
  summary: string;
  status: TieredSubscriptionProposalStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    rate: number,
    expiresAt: number,
    summary: string,
    status: TieredSubscriptionProposalStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.rate = rate;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: TieredSubscriptionProposalStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredSubscriptionProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered subscription proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveValue(): number {
    return Math.round((this.rate + this.expiresAt) * 100) / 100;
  }

  copy(): TieredSubscriptionProposal {
    return new TieredSubscriptionProposal(
      this.code,
      this.name,
      this.variant,
      this.rate,
      this.expiresAt,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a tiered subscription proposal in status created. */
export function newTieredSubscriptionProposal(code: string, name: string): TieredSubscriptionProposal {
  return new TieredSubscriptionProposal(code, name, "", 0, 0, "", "created");
}
