import * as text from "../../../../kit/text.js";

/** Where a reputation group is in its life cycle. */
export type ReputationGroupStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A reputation group. Its code is unique within a tenant. */
export class ReputationGroup {
  code: string;
  label: string;
  cohort: string;
  margin: number;
  reviewer: string;
  status: ReputationGroupStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    margin: number,
    reviewer: string,
    status: ReputationGroupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.margin = margin;
    this.reviewer = reviewer;
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

  canMoveTo(next: ReputationGroupStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
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

  moveTo(next: ReputationGroupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation group ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.margin;
  }

  copy(): ReputationGroup {
    return new ReputationGroup(this.code, this.label, this.cohort, this.margin, this.reviewer, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation group in status proposed. */
export function newReputationGroup(code: string, label: string): ReputationGroup {
  return new ReputationGroup(code, label, "", 0, "", "proposed");
}
