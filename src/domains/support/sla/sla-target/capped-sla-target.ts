/**
 * The capped sla target records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped sla target is in its life cycle. */
export type CappedSlaTargetStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped sla target as the sla team keeps it. */
export class CappedSlaTarget {
  code: string;
  name: string;
  budget: number;
  locale: string;
  retries: number;
  batchSize: number;
  visible: boolean;
  contactEmail: string;
  approved: boolean;
  bid: number;
  externalRef: string;
  status: CappedSlaTargetStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    locale: string,
    retries: number,
    batchSize: number,
    visible: boolean,
    contactEmail: string,
    approved: boolean,
    bid: number,
    externalRef: string,
    status: CappedSlaTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.locale = locale;
    this.retries = retries;
    this.batchSize = batchSize;
    this.visible = visible;
    this.contactEmail = contactEmail;
    this.approved = approved;
    this.bid = bid;
    this.externalRef = externalRef;
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

  canMoveTo(next: CappedSlaTargetStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedSlaTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped sla target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"capped sla target"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round(this.batchSize * this.budget * 100) / 100;
  }

  copy(): CappedSlaTarget {
    return new CappedSlaTarget(
      this.code,
      this.name,
      this.budget,
      this.locale,
      this.retries,
      this.batchSize,
      this.visible,
      this.contactEmail,
      this.approved,
      this.bid,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped sla target in status proposed. */
export function newCappedSlaTarget(code: string, name: string): CappedSlaTarget {
  return new CappedSlaTarget(code, name, 0, "", 0, 0, false, "", false, 0, "", "proposed");
}
