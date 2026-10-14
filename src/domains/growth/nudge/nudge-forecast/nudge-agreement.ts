import * as text from "../../../../kit/text.js";

/** Where a nudge agreement is in its life cycle. */
export type NudgeAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a nudge agreement and its current status. */
export class NudgeAgreement {
  code: string;
  title: string;
  approved: boolean;
  audienceId: string;
  attempts: number;
  reviewer: string;
  utmSource: string;
  segment: string;
  frequencyCap: number;
  status: NudgeAgreementStatus;

  constructor(
    code: string,
    title: string,
    approved: boolean,
    audienceId: string,
    attempts: number,
    reviewer: string,
    utmSource: string,
    segment: string,
    frequencyCap: number,
    status: NudgeAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.approved = approved;
    this.audienceId = audienceId;
    this.attempts = attempts;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.segment = segment;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: NudgeAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: NudgeAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.attempts - this.frequencyCap) * 100) / 100;
  }

  copy(): NudgeAgreement {
    return new NudgeAgreement(
      this.code,
      this.title,
      this.approved,
      this.audienceId,
      this.attempts,
      this.reviewer,
      this.utmSource,
      this.segment,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a nudge agreement in status proposed. */
export function newNudgeAgreement(code: string, title: string): NudgeAgreement {
  return new NudgeAgreement(code, title, false, "", 0, "", "", "", 0, "proposed");
}
