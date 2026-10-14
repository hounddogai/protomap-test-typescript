import * as text from "../../../../kit/text.js";

/** Where a csat policy is in its life cycle. */
export type CsatPolicyStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A csat policy. Its code is unique within a tenant. */
export class CsatPolicy {
  code: string;
  title: string;
  retries: number;
  region: string;
  cohort: string;
  journeyId: string;
  currency: string;
  ceiling: number;
  label: string;
  attempts: number;
  status: CsatPolicyStatus;

  constructor(
    code: string,
    title: string,
    retries: number,
    region: string,
    cohort: string,
    journeyId: string,
    currency: string,
    ceiling: number,
    label: string,
    attempts: number,
    status: CsatPolicyStatus,
  ) {
    this.code = code;
    this.title = title;
    this.retries = retries;
    this.region = region;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.currency = currency;
    this.ceiling = ceiling;
    this.label = label;
    this.attempts = attempts;
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

  canMoveTo(next: CsatPolicyStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CsatPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"csat policy"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.ceiling + this.attempts) * 100) / 100;
  }

  copy(): CsatPolicy {
    return new CsatPolicy(
      this.code,
      this.title,
      this.retries,
      this.region,
      this.cohort,
      this.journeyId,
      this.currency,
      this.ceiling,
      this.label,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a csat policy in status proposed. */
export function newCsatPolicy(code: string, title: string): CsatPolicy {
  return new CsatPolicy(code, title, 0, "", "", "", "", 0, "", 0, "proposed");
}
