/**
 * The legacy ticket view audit records of support's ticket view work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy ticket view audit is in its life cycle. */
export type LegacyTicketViewAuditStatus = "created" | "validated" | "published" | "retired";

/** One legacy ticket view audit, with what the planners need to act on it. */
export class LegacyTicketViewAudit {
  code: string;
  label: string;
  budget: number;
  weight: number;
  pinned: boolean;
  segment: string;
  updatedAt: number;
  contactEmail: string;
  quantity: number;
  checksum: string;
  locale: string;
  status: LegacyTicketViewAuditStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    weight: number,
    pinned: boolean,
    segment: string,
    updatedAt: number,
    contactEmail: string,
    quantity: number,
    checksum: string,
    locale: string,
    status: LegacyTicketViewAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.weight = weight;
    this.pinned = pinned;
    this.segment = segment;
    this.updatedAt = updatedAt;
    this.contactEmail = contactEmail;
    this.quantity = quantity;
    this.checksum = checksum;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyTicketViewAuditStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyTicketViewAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy ticket view audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.budget + this.quantity) * 100) / 100;
  }

  copy(): LegacyTicketViewAudit {
    return new LegacyTicketViewAudit(
      this.code,
      this.label,
      this.budget,
      this.weight,
      this.pinned,
      this.segment,
      this.updatedAt,
      this.contactEmail,
      this.quantity,
      this.checksum,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a legacy ticket view audit in status created. */
export function newLegacyTicketViewAudit(code: string, label: string): LegacyTicketViewAudit {
  return new LegacyTicketViewAudit(code, label, 0, 0, false, "", 0, "", 0, "", "", "created");
}
