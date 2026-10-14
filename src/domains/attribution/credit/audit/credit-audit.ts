/**
 * The credit audit records of attribution's credit work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit audit is in its life cycle. */
export type CreditAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a credit audit and its current status. */
export class CreditAudit {
  code: string;
  label: string;
  description: string;
  reviewer: string;
  graceDays: number;
  endsAt: number;
  rate: number;
  createdAt: number;
  openRate: number;
  status: CreditAuditStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    reviewer: string,
    graceDays: number,
    endsAt: number,
    rate: number,
    createdAt: number,
    openRate: number,
    status: CreditAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.reviewer = reviewer;
    this.graceDays = graceDays;
    this.endsAt = endsAt;
    this.rate = rate;
    this.createdAt = createdAt;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreditAuditStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreditAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.endsAt - this.createdAt) * 100) / 100;
  }

  copy(): CreditAudit {
    return new CreditAudit(
      this.code,
      this.label,
      this.description,
      this.reviewer,
      this.graceDays,
      this.endsAt,
      this.rate,
      this.createdAt,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a credit audit in status new. */
export function newCreditAudit(code: string, label: string): CreditAudit {
  return new CreditAudit(code, label, "", "", 0, 0, 0, 0, 0, "new");
}
