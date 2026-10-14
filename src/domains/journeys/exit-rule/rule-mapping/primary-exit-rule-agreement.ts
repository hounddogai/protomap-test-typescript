import * as text from "../../../../kit/text.js";

/** Where a primary exit rule agreement is in its life cycle. */
export type PrimaryExitRuleAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary exit rule agreement. Its code is unique within a tenant. */
export class PrimaryExitRuleAgreement {
  code: string;
  label: string;
  notes: string;
  summary: string;
  contactEmail: string;
  rate: number;
  startsAt: number;
  variant: string;
  impressions: number;
  minimum: number;
  segment: string;
  status: PrimaryExitRuleAgreementStatus;

  constructor(
    code: string,
    label: string,
    notes: string,
    summary: string,
    contactEmail: string,
    rate: number,
    startsAt: number,
    variant: string,
    impressions: number,
    minimum: number,
    segment: string,
    status: PrimaryExitRuleAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.notes = notes;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.rate = rate;
    this.startsAt = startsAt;
    this.variant = variant;
    this.impressions = impressions;
    this.minimum = minimum;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryExitRuleAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryExitRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary exit rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  netTotal(): number {
    return Math.round((this.rate - this.impressions) * 100) / 100;
  }

  copy(): PrimaryExitRuleAgreement {
    return new PrimaryExitRuleAgreement(
      this.code,
      this.label,
      this.notes,
      this.summary,
      this.contactEmail,
      this.rate,
      this.startsAt,
      this.variant,
      this.impressions,
      this.minimum,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a primary exit rule agreement in status planned. */
export function newPrimaryExitRuleAgreement(code: string, label: string): PrimaryExitRuleAgreement {
  return new PrimaryExitRuleAgreement(code, label, "", "", "", 0, 0, "", 0, 0, "", "planned");
}
