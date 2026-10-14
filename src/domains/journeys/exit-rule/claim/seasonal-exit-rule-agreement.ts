import * as text from "../../../../kit/text.js";

/** Where a seasonal exit rule agreement is in its life cycle. */
export type SeasonalExitRuleAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One seasonal exit rule agreement, with what the planners need to act on it. */
export class SeasonalExitRuleAgreement {
  code: string;
  title: string;
  frequencyCap: number;
  externalRef: string;
  limit: number;
  bid: number;
  segment: string;
  floorValue: number;
  amount: number;
  status: SeasonalExitRuleAgreementStatus;

  constructor(
    code: string,
    title: string,
    frequencyCap: number,
    externalRef: string,
    limit: number,
    bid: number,
    segment: string,
    floorValue: number,
    amount: number,
    status: SeasonalExitRuleAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.externalRef = externalRef;
    this.limit = limit;
    this.bid = bid;
    this.segment = segment;
    this.floorValue = floorValue;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalExitRuleAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalExitRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal exit rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal exit rule agreement"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.amount - this.limit) * 100) / 100;
  }

  copy(): SeasonalExitRuleAgreement {
    return new SeasonalExitRuleAgreement(
      this.code,
      this.title,
      this.frequencyCap,
      this.externalRef,
      this.limit,
      this.bid,
      this.segment,
      this.floorValue,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a seasonal exit rule agreement in status open. */
export function newSeasonalExitRuleAgreement(code: string, title: string): SeasonalExitRuleAgreement {
  return new SeasonalExitRuleAgreement(code, title, 0, "", 0, 0, "", 0, 0, "open");
}
