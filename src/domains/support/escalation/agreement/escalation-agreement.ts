/**
 * The escalation agreement records of support's escalation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a escalation agreement is in its life cycle. */
export type EscalationAgreementStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A escalation agreement as the escalation team keeps it. */
export class EscalationAgreement {
  code: string;
  title: string;
  createdAt: number;
  active: boolean;
  visible: boolean;
  cost: number;
  variant: string;
  windowDays: number;
  status: EscalationAgreementStatus;

  constructor(
    code: string,
    title: string,
    createdAt: number,
    active: boolean,
    visible: boolean,
    cost: number,
    variant: string,
    windowDays: number,
    status: EscalationAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.createdAt = createdAt;
    this.active = active;
    this.visible = visible;
    this.cost = cost;
    this.variant = variant;
    this.windowDays = windowDays;
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

  canMoveTo(next: EscalationAgreementStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
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

  moveTo(next: EscalationAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`escalation agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.createdAt - this.windowDays) * 100) / 100;
  }

  copy(): EscalationAgreement {
    return new EscalationAgreement(
      this.code,
      this.title,
      this.createdAt,
      this.active,
      this.visible,
      this.cost,
      this.variant,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a escalation agreement in status open. */
export function newEscalationAgreement(code: string, title: string): EscalationAgreement {
  return new EscalationAgreement(code, title, 0, false, false, 0, "", 0, "open");
}
