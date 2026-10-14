/**
 * The pacing audit records of adops's pacing work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pacing audit is in its life cycle. */
export type PacingAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A pacing audit as the pacing team keeps it. */
export class PacingAudit {
  code: string;
  title: string;
  amount: number;
  limit: number;
  contactEmail: string;
  ownerId: string;
  timezone: string;
  variant: string;
  status: PacingAuditStatus;

  constructor(
    code: string,
    title: string,
    amount: number,
    limit: number,
    contactEmail: string,
    ownerId: string,
    timezone: string,
    variant: string,
    status: PacingAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.amount = amount;
    this.limit = limit;
    this.contactEmail = contactEmail;
    this.ownerId = ownerId;
    this.timezone = timezone;
    this.variant = variant;
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

  canMoveTo(next: PacingAuditStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
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

  moveTo(next: PacingAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round(this.limit * this.amount * 100) / 100;
  }

  copy(): PacingAudit {
    return new PacingAudit(
      this.code,
      this.title,
      this.amount,
      this.limit,
      this.contactEmail,
      this.ownerId,
      this.timezone,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a pacing audit in status new. */
export function newPacingAudit(code: string, title: string): PacingAudit {
  return new PacingAudit(code, title, 0, 0, "", "", "", "", "new");
}
