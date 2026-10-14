import * as text from "../../../../kit/text.js";

/** Where a primary proof rule is in its life cycle. */
export type PrimaryProofRuleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary proof rule. Its code is unique within a tenant. */
export class PrimaryProofRule {
  code: string;
  label: string;
  contactEmail: string;
  budget: number;
  locale: string;
  margin: number;
  status: PrimaryProofRuleStatus;

  constructor(
    code: string,
    label: string,
    contactEmail: string,
    budget: number,
    locale: string,
    margin: number,
    status: PrimaryProofRuleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.contactEmail = contactEmail;
    this.budget = budget;
    this.locale = locale;
    this.margin = margin;
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

  canMoveTo(next: PrimaryProofRuleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
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

  moveTo(next: PrimaryProofRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary proof rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary proof rule"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.budget - this.margin) * 100) / 100;
  }

  copy(): PrimaryProofRule {
    return new PrimaryProofRule(
      this.code,
      this.label,
      this.contactEmail,
      this.budget,
      this.locale,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary proof rule in status planned. */
export function newPrimaryProofRule(code: string, label: string): PrimaryProofRule {
  return new PrimaryProofRule(code, label, "", 0, "", 0, "planned");
}
