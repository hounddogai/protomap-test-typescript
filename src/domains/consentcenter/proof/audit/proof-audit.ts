/**
 * The proof audit records of consentcenter's proof work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a proof audit is in its life cycle. */
export type ProofAuditStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A proof audit. Its code is unique within a tenant. */
export class ProofAudit {
  code: string;
  title: string;
  budget: number;
  journeyId: string;
  visible: boolean;
  minimum: number;
  ceiling: number;
  version: number;
  attempts: number;
  status: ProofAuditStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    journeyId: string,
    visible: boolean,
    minimum: number,
    ceiling: number,
    version: number,
    attempts: number,
    status: ProofAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.journeyId = journeyId;
    this.visible = visible;
    this.minimum = minimum;
    this.ceiling = ceiling;
    this.version = version;
    this.attempts = attempts;
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

  canMoveTo(next: ProofAuditStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
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
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ProofAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`proof audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  netTotal(): number {
    return Math.round((this.ceiling - this.budget) * 100) / 100;
  }

  copy(): ProofAudit {
    return new ProofAudit(
      this.code,
      this.title,
      this.budget,
      this.journeyId,
      this.visible,
      this.minimum,
      this.ceiling,
      this.version,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a proof audit in status open. */
export function newProofAudit(code: string, title: string): ProofAudit {
  return new ProofAudit(code, title, 0, "", false, 0, 0, 0, 0, "open");
}
