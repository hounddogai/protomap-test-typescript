/**
 * The csat audit records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat audit is in its life cycle. */
export type CsatAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A csat audit. Its code is unique within a tenant. */
export class CsatAudit {
  code: string;
  title: string;
  channel: string;
  notes: string;
  frequencyCap: number;
  ownerId: string;
  status: CsatAuditStatus;

  constructor(
    code: string,
    title: string,
    channel: string,
    notes: string,
    frequencyCap: number,
    ownerId: string,
    status: CsatAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.channel = channel;
    this.notes = notes;
    this.frequencyCap = frequencyCap;
    this.ownerId = ownerId;
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

  canMoveTo(next: CsatAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: CsatAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"csat audit"} ${this.code}`;
  }

  measuredValue(): number {
    return this.frequencyCap;
  }

  copy(): CsatAudit {
    return new CsatAudit(this.code, this.title, this.channel, this.notes, this.frequencyCap, this.ownerId, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a csat audit in status proposed. */
export function newCsatAudit(code: string, title: string): CsatAudit {
  return new CsatAudit(code, title, "", "", 0, "", "proposed");
}
