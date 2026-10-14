import * as text from "../../../../kit/text.js";

/** Where a legacy fraud check rule is in its life cycle. */
export type LegacyFraudCheckRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy fraud check rule as the fraud check team keeps it. */
export class LegacyFraudCheckRule {
  code: string;
  title: string;
  contactEmail: string;
  sendAt: number;
  description: string;
  category: string;
  ceiling: number;
  status: LegacyFraudCheckRuleStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    sendAt: number,
    description: string,
    category: string,
    ceiling: number,
    status: LegacyFraudCheckRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.sendAt = sendAt;
    this.description = description;
    this.category = category;
    this.ceiling = ceiling;
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

  canMoveTo(next: LegacyFraudCheckRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
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

  moveTo(next: LegacyFraudCheckRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy fraud check rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netVolume(): number {
    return Math.round(this.ceiling * this.sendAt * 100) / 100;
  }

  copy(): LegacyFraudCheckRule {
    return new LegacyFraudCheckRule(
      this.code,
      this.title,
      this.contactEmail,
      this.sendAt,
      this.description,
      this.category,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy fraud check rule in status proposed. */
export function newLegacyFraudCheckRule(code: string, title: string): LegacyFraudCheckRule {
  return new LegacyFraudCheckRule(code, title, "", 0, "", "", 0, "proposed");
}
