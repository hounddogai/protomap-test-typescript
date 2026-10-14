import * as text from "../../../../kit/text.js";

/** Where a legacy complaint proposal is in its life cycle. */
export type LegacyComplaintProposalStatus = "requested" | "granted" | "revoked" | "expired";

/** One legacy complaint proposal, with what the planners need to act on it. */
export class LegacyComplaintProposal {
  code: string;
  label: string;
  margin: number;
  timezone: string;
  openRate: number;
  status: LegacyComplaintProposalStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    timezone: string,
    openRate: number,
    status: LegacyComplaintProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.timezone = timezone;
    this.openRate = openRate;
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

  canMoveTo(next: LegacyComplaintProposalStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyComplaintProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy complaint proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netVolume(): number {
    return Math.round((this.margin + this.openRate) * 100) / 100;
  }

  copy(): LegacyComplaintProposal {
    return new LegacyComplaintProposal(this.code, this.label, this.margin, this.timezone, this.openRate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy complaint proposal in status requested. */
export function newLegacyComplaintProposal(code: string, label: string): LegacyComplaintProposal {
  return new LegacyComplaintProposal(code, label, 0, "", 0, "requested");
}
