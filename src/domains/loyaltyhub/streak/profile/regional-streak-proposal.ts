import * as text from "../../../../kit/text.js";

/** Where a regional streak proposal is in its life cycle. */
export type RegionalStreakProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional streak proposal as the streak team keeps it. */
export class RegionalStreakProposal {
  code: string;
  label: string;
  margin: number;
  rate: number;
  createdAt: number;
  ratio: number;
  revision: number;
  variant: string;
  cohort: string;
  channel: string;
  amount: number;
  status: RegionalStreakProposalStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    rate: number,
    createdAt: number,
    ratio: number,
    revision: number,
    variant: string,
    cohort: string,
    channel: string,
    amount: number,
    status: RegionalStreakProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.rate = rate;
    this.createdAt = createdAt;
    this.ratio = ratio;
    this.revision = revision;
    this.variant = variant;
    this.cohort = cohort;
    this.channel = channel;
    this.amount = amount;
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

  canMoveTo(next: RegionalStreakProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: RegionalStreakProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional streak proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"regional streak proposal"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.amount * this.margin * 100) / 100;
  }

  copy(): RegionalStreakProposal {
    return new RegionalStreakProposal(
      this.code,
      this.label,
      this.margin,
      this.rate,
      this.createdAt,
      this.ratio,
      this.revision,
      this.variant,
      this.cohort,
      this.channel,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional streak proposal in status requested. */
export function newRegionalStreakProposal(code: string, label: string): RegionalStreakProposal {
  return new RegionalStreakProposal(code, label, 0, 0, 0, 0, 0, "", "", "", 0, "requested");
}
