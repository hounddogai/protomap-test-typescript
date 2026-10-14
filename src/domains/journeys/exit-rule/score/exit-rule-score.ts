/**
 * The exit rule score records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule score is in its life cycle. */
export type ExitRuleScoreStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A exit rule score as the exit rule team keeps it. */
export class ExitRuleScore {
  code: string;
  name: string;
  checksum: string;
  locale: string;
  campaignRef: string;
  contactEmail: string;
  quantity: number;
  status: ExitRuleScoreStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    locale: string,
    campaignRef: string,
    contactEmail: string,
    quantity: number,
    status: ExitRuleScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.contactEmail = contactEmail;
    this.quantity = quantity;
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

  canMoveTo(next: ExitRuleScoreStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ExitRuleScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ExitRuleScore {
    return new ExitRuleScore(
      this.code,
      this.name,
      this.checksum,
      this.locale,
      this.campaignRef,
      this.contactEmail,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a exit rule score in status proposed. */
export function newExitRuleScore(code: string, name: string): ExitRuleScore {
  return new ExitRuleScore(code, name, "", "", "", "", 0, "proposed");
}
