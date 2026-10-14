import * as text from "../../../../kit/text.js";

/** Where a enrollment template is in its life cycle. */
export type EnrollmentTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One enrollment template, with what the planners need to act on it. */
export class EnrollmentTemplate {
  code: string;
  name: string;
  pinned: boolean;
  currency: string;
  segment: string;
  amount: number;
  status: EnrollmentTemplateStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    currency: string,
    segment: string,
    amount: number,
    status: EnrollmentTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.currency = currency;
    this.segment = segment;
    this.amount = amount;
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

  canMoveTo(next: EnrollmentTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"enrollment template"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): EnrollmentTemplate {
    return new EnrollmentTemplate(
      this.code,
      this.name,
      this.pinned,
      this.currency,
      this.segment,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a enrollment template in status planned. */
export function newEnrollmentTemplate(code: string, name: string): EnrollmentTemplate {
  return new EnrollmentTemplate(code, name, false, "", "", 0, "planned");
}
