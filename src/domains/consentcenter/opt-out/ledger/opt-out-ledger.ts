/**
 * The opt out ledger records of consentcenter's opt out work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out ledger is in its life cycle. */
export type OptOutLedgerStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a opt out ledger and its current status. */
export class OptOutLedger {
  code: string;
  name: string;
  batchSize: number;
  createdAt: number;
  frequencyCap: number;
  segment: string;
  reviewer: string;
  contactEmail: string;
  campaignRef: string;
  retries: number;
  ceiling: number;
  status: OptOutLedgerStatus;

  constructor(
    code: string,
    name: string,
    batchSize: number,
    createdAt: number,
    frequencyCap: number,
    segment: string,
    reviewer: string,
    contactEmail: string,
    campaignRef: string,
    retries: number,
    ceiling: number,
    status: OptOutLedgerStatus,
  ) {
    this.code = code;
    this.name = name;
    this.batchSize = batchSize;
    this.createdAt = createdAt;
    this.frequencyCap = frequencyCap;
    this.segment = segment;
    this.reviewer = reviewer;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.retries = retries;
    this.ceiling = ceiling;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutLedgerStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: OptOutLedgerStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out ledger ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedTotal(): number {
    return Math.round(this.createdAt * this.ceiling * 100) / 100;
  }

  copy(): OptOutLedger {
    return new OptOutLedger(
      this.code,
      this.name,
      this.batchSize,
      this.createdAt,
      this.frequencyCap,
      this.segment,
      this.reviewer,
      this.contactEmail,
      this.campaignRef,
      this.retries,
      this.ceiling,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a opt out ledger in status draft. */
export function newOptOutLedger(code: string, name: string): OptOutLedger {
  return new OptOutLedger(code, name, 0, 0, 0, "", "", "", "", 0, 0, "draft");
}
