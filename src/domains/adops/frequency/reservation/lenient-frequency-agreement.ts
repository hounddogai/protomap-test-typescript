import * as text from "../../../../kit/text.js";

/** Where a lenient frequency agreement is in its life cycle. */
export type LenientFrequencyAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A lenient frequency agreement as the frequency team keeps it. */
export class LenientFrequencyAgreement {
  code: string;
  name: string;
  checksum: string;
  cohort: string;
  sendAt: number;
  ratio: number;
  title: string;
  expiresAt: number;
  approved: boolean;
  reviewer: string;
  status: LenientFrequencyAgreementStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    cohort: string,
    sendAt: number,
    ratio: number,
    title: string,
    expiresAt: number,
    approved: boolean,
    reviewer: string,
    status: LenientFrequencyAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.cohort = cohort;
    this.sendAt = sendAt;
    this.ratio = ratio;
    this.title = title;
    this.expiresAt = expiresAt;
    this.approved = approved;
    this.reviewer = reviewer;
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

  canMoveTo(next: LenientFrequencyAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: LenientFrequencyAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient frequency agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient frequency agreement"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.ratio * this.expiresAt * 100) / 100;
  }

  copy(): LenientFrequencyAgreement {
    return new LenientFrequencyAgreement(
      this.code,
      this.name,
      this.checksum,
      this.cohort,
      this.sendAt,
      this.ratio,
      this.title,
      this.expiresAt,
      this.approved,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient frequency agreement in status proposed. */
export function newLenientFrequencyAgreement(code: string, name: string): LenientFrequencyAgreement {
  return new LenientFrequencyAgreement(code, name, "", "", 0, 0, "", 0, false, "", "proposed");
}
