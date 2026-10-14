import * as text from "../../../../kit/text.js";

/** Where a invite agreement is in its life cycle. */
export type InviteAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a invite agreement and its current status. */
export class InviteAgreement {
  code: string;
  label: string;
  budget: number;
  region: string;
  segment: string;
  status: InviteAgreementStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    region: string,
    segment: string,
    status: InviteAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.region = region;
    this.segment = segment;
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

  canMoveTo(next: InviteAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InviteAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.budget;
  }

  copy(): InviteAgreement {
    return new InviteAgreement(this.code, this.label, this.budget, this.region, this.segment, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a invite agreement in status open. */
export function newInviteAgreement(code: string, label: string): InviteAgreement {
  return new InviteAgreement(code, label, 0, "", "", "open");
}
