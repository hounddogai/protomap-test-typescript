import * as text from "../../../../kit/text.js";

/** Where a default conversion agreement is in its life cycle. */
export type DefaultConversionAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One default conversion agreement, with what the planners need to act on it. */
export class DefaultConversionAgreement {
  code: string;
  label: string;
  summary: string;
  variant: string;
  channel: string;
  utmSource: string;
  ownerId: string;
  frequencyCap: number;
  budget: number;
  rate: number;
  reviewer: string;
  status: DefaultConversionAgreementStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    variant: string,
    channel: string,
    utmSource: string,
    ownerId: string,
    frequencyCap: number,
    budget: number,
    rate: number,
    reviewer: string,
    status: DefaultConversionAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.variant = variant;
    this.channel = channel;
    this.utmSource = utmSource;
    this.ownerId = ownerId;
    this.frequencyCap = frequencyCap;
    this.budget = budget;
    this.rate = rate;
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

  canMoveTo(next: DefaultConversionAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
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

  moveTo(next: DefaultConversionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default conversion agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  adjustedLoad(): number {
    return Math.round(this.rate * this.frequencyCap * 100) / 100;
  }

  copy(): DefaultConversionAgreement {
    return new DefaultConversionAgreement(
      this.code,
      this.label,
      this.summary,
      this.variant,
      this.channel,
      this.utmSource,
      this.ownerId,
      this.frequencyCap,
      this.budget,
      this.rate,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a default conversion agreement in status proposed. */
export function newDefaultConversionAgreement(code: string, label: string): DefaultConversionAgreement {
  return new DefaultConversionAgreement(code, label, "", "", "", "", "", 0, 0, 0, "", "proposed");
}
