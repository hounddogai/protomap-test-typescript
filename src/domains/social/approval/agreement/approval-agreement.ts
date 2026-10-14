/**
 * The approval agreement records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval agreement is in its life cycle. */
export type ApprovalAgreementStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One approval agreement, with what the planners need to act on it. */
export class ApprovalAgreement {
  code: string;
  name: string;
  segment: string;
  margin: number;
  title: string;
  ratio: number;
  status: ApprovalAgreementStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    margin: number,
    title: string,
    ratio: number,
    status: ApprovalAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.margin = margin;
    this.title = title;
    this.ratio = ratio;
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

  canMoveTo(next: ApprovalAgreementStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: ApprovalAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedLoad(): number {
    return Math.round(this.ratio * this.margin * 100) / 100;
  }

  copy(): ApprovalAgreement {
    return new ApprovalAgreement(this.code, this.name, this.segment, this.margin, this.title, this.ratio, this.status);
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a approval agreement in status planned. */
export function newApprovalAgreement(code: string, name: string): ApprovalAgreement {
  return new ApprovalAgreement(code, name, "", 0, "", 0, "planned");
}
