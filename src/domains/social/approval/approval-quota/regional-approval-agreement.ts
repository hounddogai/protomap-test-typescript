import * as text from "../../../../kit/text.js";

/** Where a regional approval agreement is in its life cycle. */
export type RegionalApprovalAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional approval agreement as the approval team keeps it. */
export class RegionalApprovalAgreement {
  code: string;
  label: string;
  externalRef: string;
  title: string;
  sequence: number;
  description: string;
  expiresAt: number;
  conversionRate: number;
  campaignRef: string;
  status: RegionalApprovalAgreementStatus;

  constructor(
    code: string,
    label: string,
    externalRef: string,
    title: string,
    sequence: number,
    description: string,
    expiresAt: number,
    conversionRate: number,
    campaignRef: string,
    status: RegionalApprovalAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.externalRef = externalRef;
    this.title = title;
    this.sequence = sequence;
    this.description = description;
    this.expiresAt = expiresAt;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: RegionalApprovalAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalApprovalAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional approval agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"regional approval agreement"} ${this.code}`;
  }

  netValue(): number {
    return Math.round(this.sequence * this.conversionRate * 100) / 100;
  }

  copy(): RegionalApprovalAgreement {
    return new RegionalApprovalAgreement(
      this.code,
      this.label,
      this.externalRef,
      this.title,
      this.sequence,
      this.description,
      this.expiresAt,
      this.conversionRate,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a regional approval agreement in status proposed. */
export function newRegionalApprovalAgreement(code: string, label: string): RegionalApprovalAgreement {
  return new RegionalApprovalAgreement(code, label, "", "", 0, "", 0, 0, "", "proposed");
}
