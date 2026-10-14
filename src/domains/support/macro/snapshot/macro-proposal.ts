import * as text from "../../../../kit/text.js";

/** Where a macro proposal is in its life cycle. */
export type MacroProposalStatus = "new" | "queued" | "running" | "done" | "failed";

/** One macro proposal, with what the planners need to act on it. */
export class MacroProposal {
  code: string;
  label: string;
  contactEmail: string;
  openRate: number;
  windowDays: number;
  quantity: number;
  campaignRef: string;
  cohort: string;
  floorValue: number;
  approved: boolean;
  variant: string;
  status: MacroProposalStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    openRate: number,
    windowDays: number,
    quantity: number,
    campaignRef: string,
    cohort: string,
    floorValue: number,
    approved: boolean,
    variant: string,
    status: MacroProposalStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.openRate = openRate;
    this.windowDays = windowDays;
    this.quantity = quantity;
    this.campaignRef = campaignRef;
    this.cohort = cohort;
    this.floorValue = floorValue;
    this.approved = approved;
    this.variant = variant;
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

  canMoveTo(next: MacroProposalStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: MacroProposalStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro proposal ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"macro proposal"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.windowDays * this.quantity * 100) / 100;
  }

  copy(): MacroProposal {
    return new MacroProposal(
      this.code,
      this.label,
      this.contactEmail,
      this.openRate,
      this.windowDays,
      this.quantity,
      this.campaignRef,
      this.cohort,
      this.floorValue,
      this.approved,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro proposal in status new. */
export function newMacroProposal(code: string, label: string): MacroProposal {
  return new MacroProposal(code, label, "", 0, 0, 0, "", "", 0, false, "", "new");
}
