import * as text from "../../../../kit/text.js";

/** Where a cohort agreement is in its life cycle. */
export type CohortAgreementStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A cohort agreement as the cohort team keeps it. */
export class CohortAgreement {
  code: string;
  label: string;
  campaignRef: string;
  reviewer: string;
  visible: boolean;
  summary: string;
  approved: boolean;
  discount: number;
  createdAt: number;
  status: CohortAgreementStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    reviewer: string,
    visible: boolean,
    summary: string,
    approved: boolean,
    discount: number,
    createdAt: number,
    status: CohortAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.reviewer = reviewer;
    this.visible = visible;
    this.summary = summary;
    this.approved = approved;
    this.discount = discount;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: CohortAgreementStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CohortAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netLoad(): number {
    return Math.round(this.discount * this.createdAt * 100) / 100;
  }

  copy(): CohortAgreement {
    return new CohortAgreement(
      this.code,
      this.label,
      this.campaignRef,
      this.reviewer,
      this.visible,
      this.summary,
      this.approved,
      this.discount,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a cohort agreement in status idle. */
export function newCohortAgreement(code: string, label: string): CohortAgreement {
  return new CohortAgreement(code, label, "", "", false, "", false, 0, 0, "idle");
}
