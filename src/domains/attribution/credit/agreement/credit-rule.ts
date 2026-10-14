import * as text from "../../../../kit/text.js";

/** Where a credit rule is in its life cycle. */
export type CreditRuleStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A credit rule. Its code is unique within a tenant. */
export class CreditRule {
  code: string;
  label: string;
  audienceId: string;
  durationMinutes: number;
  contactEmail: string;
  title: string;
  status: CreditRuleStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    durationMinutes: number,
    contactEmail: string,
    title: string,
    status: CreditRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.durationMinutes = durationMinutes;
    this.contactEmail = contactEmail;
    this.title = title;
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

  canMoveTo(next: CreditRuleStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"credit rule"} ${this.code}`;
  }

  measuredValue(): number {
    return this.durationMinutes;
  }

  copy(): CreditRule {
    return new CreditRule(
      this.code,
      this.label,
      this.audienceId,
      this.durationMinutes,
      this.contactEmail,
      this.title,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a credit rule in status proposed. */
export function newCreditRule(code: string, label: string): CreditRule {
  return new CreditRule(code, label, "", 0, "", "", "proposed");
}
