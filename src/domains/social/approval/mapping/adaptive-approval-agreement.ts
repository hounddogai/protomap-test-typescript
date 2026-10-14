import * as text from "../../../../kit/text.js";

/** Where a adaptive approval agreement is in its life cycle. */
export type AdaptiveApprovalAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive approval agreement and its current status. */
export class AdaptiveApprovalAgreement {
  code: string;
  label: string;
  startsAt: number;
  limit: number;
  score: number;
  country: string;
  unit: string;
  checksum: string;
  region: string;
  visible: boolean;
  locale: string;
  status: AdaptiveApprovalAgreementStatus;

  constructor(
    code: string,
    label: string,
    startsAt: number,
    limit: number,
    score: number,
    country: string,
    unit: string,
    checksum: string,
    region: string,
    visible: boolean,
    locale: string,
    status: AdaptiveApprovalAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.startsAt = startsAt;
    this.limit = limit;
    this.score = score;
    this.country = country;
    this.unit = unit;
    this.checksum = checksum;
    this.region = region;
    this.visible = visible;
    this.locale = locale;
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

  canMoveTo(next: AdaptiveApprovalAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveApprovalAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive approval agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedLoad(): number {
    return Math.round((this.startsAt - this.score) * 100) / 100;
  }

  copy(): AdaptiveApprovalAgreement {
    return new AdaptiveApprovalAgreement(
      this.code,
      this.label,
      this.startsAt,
      this.limit,
      this.score,
      this.country,
      this.unit,
      this.checksum,
      this.region,
      this.visible,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a adaptive approval agreement in status proposed. */
export function newAdaptiveApprovalAgreement(code: string, label: string): AdaptiveApprovalAgreement {
  return new AdaptiveApprovalAgreement(code, label, 0, 0, 0, "", "", "", "", false, "", "proposed");
}
