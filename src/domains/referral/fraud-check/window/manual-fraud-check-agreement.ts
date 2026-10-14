import * as text from "../../../../kit/text.js";

/** Where a manual fraud check agreement is in its life cycle. */
export type ManualFraudCheckAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a manual fraud check agreement and its current status. */
export class ManualFraudCheckAgreement {
  code: string;
  label: string;
  budget: number;
  summary: string;
  ownerId: string;
  externalRef: string;
  status: ManualFraudCheckAgreementStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    summary: string,
    ownerId: string,
    externalRef: string,
    status: ManualFraudCheckAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.summary = summary;
    this.ownerId = ownerId;
    this.externalRef = externalRef;
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

  canMoveTo(next: ManualFraudCheckAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "cancelled";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: ManualFraudCheckAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual fraud check agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"manual fraud check agreement"} ${this.code}`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): ManualFraudCheckAgreement {
    return new ManualFraudCheckAgreement(
      this.code,
      this.label,
      this.budget,
      this.summary,
      this.ownerId,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual fraud check agreement in status planned. */
export function newManualFraudCheckAgreement(code: string, label: string): ManualFraudCheckAgreement {
  return new ManualFraudCheckAgreement(code, label, 0, "", "", "", "planned");
}
