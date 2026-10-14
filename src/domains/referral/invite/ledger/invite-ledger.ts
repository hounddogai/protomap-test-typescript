/**
 * The invite ledger records of referral's invite work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a invite ledger is in its life cycle. */
export type InviteLedgerStatus = "new" | "queued" | "running" | "done" | "failed";

/** A invite ledger. Its code is unique within a tenant. */
export class InviteLedger {
  code: string;
  title: string;
  endsAt: number;
  weight: number;
  createdAt: number;
  label: string;
  reviewer: string;
  status: InviteLedgerStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    weight: number,
    createdAt: number,
    label: string,
    reviewer: string,
    status: InviteLedgerStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.weight = weight;
    this.createdAt = createdAt;
    this.label = label;
    this.reviewer = reviewer;
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

  canMoveTo(next: InviteLedgerStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: InviteLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`invite ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedVolume(): number {
    return Math.round(this.createdAt * this.endsAt * 100) / 100;
  }

  copy(): InviteLedger {
    return new InviteLedger(
      this.code,
      this.title,
      this.endsAt,
      this.weight,
      this.createdAt,
      this.label,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a invite ledger in status new. */
export function newInviteLedger(code: string, title: string): InviteLedger {
  return new InviteLedger(code, title, 0, 0, 0, "", "", "new");
}
