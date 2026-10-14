import * as text from "../../../../kit/text.js";

/** Where a exit rule agreement is in its life cycle. */
export type ExitRuleAgreementStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One exit rule agreement, with what the planners need to act on it. */
export class ExitRuleAgreement {
  code: string;
  title: string;
  limit: number;
  quantity: number;
  minimum: number;
  revision: number;
  timezone: string;
  archived: boolean;
  threshold: number;
  description: string;
  journeyId: string;
  status: ExitRuleAgreementStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    quantity: number,
    minimum: number,
    revision: number,
    timezone: string,
    archived: boolean,
    threshold: number,
    description: string,
    journeyId: string,
    status: ExitRuleAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.quantity = quantity;
    this.minimum = minimum;
    this.revision = revision;
    this.timezone = timezone;
    this.archived = archived;
    this.threshold = threshold;
    this.description = description;
    this.journeyId = journeyId;
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

  canMoveTo(next: ExitRuleAgreementStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedValue(): number {
    return Math.round((this.threshold - this.minimum) * 100) / 100;
  }

  copy(): ExitRuleAgreement {
    return new ExitRuleAgreement(
      this.code,
      this.title,
      this.limit,
      this.quantity,
      this.minimum,
      this.revision,
      this.timezone,
      this.archived,
      this.threshold,
      this.description,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a exit rule agreement in status proposed. */
export function newExitRuleAgreement(code: string, title: string): ExitRuleAgreement {
  return new ExitRuleAgreement(code, title, 0, 0, 0, 0, "", false, 0, "", "", "proposed");
}
