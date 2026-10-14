import * as text from "../../../../kit/text.js";

/** Where a retention agreement is in its life cycle. */
export type RetentionAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A retention agreement as the retention team keeps it. */
export class RetentionAgreement {
  code: string;
  label: string;
  campaignRef: string;
  summary: string;
  contactEmail: string;
  unit: string;
  rate: number;
  durationMinutes: number;
  source: string;
  score: number;
  status: RetentionAgreementStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    summary: string,
    contactEmail: string,
    unit: string,
    rate: number,
    durationMinutes: number,
    source: string,
    score: number,
    status: RetentionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.summary = summary;
    this.contactEmail = contactEmail;
    this.unit = unit;
    this.rate = rate;
    this.durationMinutes = durationMinutes;
    this.source = source;
    this.score = score;
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

  canMoveTo(next: RetentionAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "completed":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"retention agreement"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round(this.rate * this.score * 100) / 100;
  }

  copy(): RetentionAgreement {
    return new RetentionAgreement(
      this.code,
      this.label,
      this.campaignRef,
      this.summary,
      this.contactEmail,
      this.unit,
      this.rate,
      this.durationMinutes,
      this.source,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a retention agreement in status planned. */
export function newRetentionAgreement(code: string, label: string): RetentionAgreement {
  return new RetentionAgreement(code, label, "", "", "", "", 0, 0, "", 0, "planned");
}
