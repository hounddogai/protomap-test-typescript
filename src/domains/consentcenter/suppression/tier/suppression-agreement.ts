import * as text from "../../../../kit/text.js";

/** Where a suppression agreement is in its life cycle. */
export type SuppressionAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A suppression agreement. Its code is unique within a tenant. */
export class SuppressionAgreement {
  code: string;
  name: string;
  journeyId: string;
  active: boolean;
  summary: string;
  amount: number;
  status: SuppressionAgreementStatus;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    active: boolean,
    summary: string,
    amount: number,
    status: SuppressionAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.active = active;
    this.summary = summary;
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

  canMoveTo(next: SuppressionAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "completed":
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

  moveTo(next: SuppressionAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): SuppressionAgreement {
    return new SuppressionAgreement(
      this.code,
      this.name,
      this.journeyId,
      this.active,
      this.summary,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a suppression agreement in status planned. */
export function newSuppressionAgreement(code: string, name: string): SuppressionAgreement {
  return new SuppressionAgreement(code, name, "", false, "", 0, "planned");
}
