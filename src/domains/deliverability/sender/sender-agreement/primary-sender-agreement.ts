/**
 * The primary sender agreement records of deliverability's sender work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a primary sender agreement is in its life cycle. */
export type PrimarySenderAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A primary sender agreement. Its code is unique within a tenant. */
export class PrimarySenderAgreement {
  code: string;
  name: string;
  priority: number;
  clicks: number;
  label: string;
  status: PrimarySenderAgreementStatus;

  constructor(
    code: string,
    name: string,
    priority: number,
    clicks: number,
    label: string,
    status: PrimarySenderAgreementStatus,
  ) {
    this.code = code;
    this.name = name;
    this.priority = priority;
    this.clicks = clicks;
    this.label = label;
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

  canMoveTo(next: PrimarySenderAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: PrimarySenderAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sender agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveVolume(): number {
    return Math.round((this.clicks - this.priority) * 100) / 100;
  }

  copy(): PrimarySenderAgreement {
    return new PrimarySenderAgreement(this.code, this.name, this.priority, this.clicks, this.label, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a primary sender agreement in status open. */
export function newPrimarySenderAgreement(code: string, name: string): PrimarySenderAgreement {
  return new PrimarySenderAgreement(code, name, 0, 0, "", "open");
}
