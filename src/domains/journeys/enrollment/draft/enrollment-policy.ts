import * as text from "../../../../kit/text.js";

/** Where a enrollment policy is in its life cycle. */
export type EnrollmentPolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One enrollment policy, with what the planners need to act on it. */
export class EnrollmentPolicy {
  code: string;
  name: string;
  segment: string;
  discount: number;
  label: string;
  sequence: number;
  status: EnrollmentPolicyStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    discount: number,
    label: string,
    sequence: number,
    status: EnrollmentPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.discount = discount;
    this.label = label;
    this.sequence = sequence;
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

  canMoveTo(next: EnrollmentPolicyStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.sequence + this.discount) * 100) / 100;
  }

  copy(): EnrollmentPolicy {
    return new EnrollmentPolicy(
      this.code,
      this.name,
      this.segment,
      this.discount,
      this.label,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a enrollment policy in status open. */
export function newEnrollmentPolicy(code: string, name: string): EnrollmentPolicy {
  return new EnrollmentPolicy(code, name, "", 0, "", 0, "open");
}
