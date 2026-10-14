/**
 * The batched branch agreement records of journeys's branch work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched branch agreement is in its life cycle. */
export type BatchedBranchAgreementStatus = "created" | "validated" | "published" | "retired";

/** A batched branch agreement. Its code is unique within a tenant. */
export class BatchedBranchAgreement {
  code: string;
  title: string;
  revision: number;
  sendAt: number;
  graceDays: number;
  createdAt: number;
  name: string;
  currency: string;
  region: string;
  variant: string;
  bid: number;
  status: BatchedBranchAgreementStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    sendAt: number,
    graceDays: number,
    createdAt: number,
    name: string,
    currency: string,
    region: string,
    variant: string,
    bid: number,
    status: BatchedBranchAgreementStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.sendAt = sendAt;
    this.graceDays = graceDays;
    this.createdAt = createdAt;
    this.name = name;
    this.currency = currency;
    this.region = region;
    this.variant = variant;
    this.bid = bid;
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

  canMoveTo(next: BatchedBranchAgreementStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
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

  moveTo(next: BatchedBranchAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched branch agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${"batched branch agreement"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round((this.sendAt + this.bid) * 100) / 100;
  }

  copy(): BatchedBranchAgreement {
    return new BatchedBranchAgreement(
      this.code,
      this.title,
      this.revision,
      this.sendAt,
      this.graceDays,
      this.createdAt,
      this.name,
      this.currency,
      this.region,
      this.variant,
      this.bid,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a batched branch agreement in status created. */
export function newBatchedBranchAgreement(code: string, title: string): BatchedBranchAgreement {
  return new BatchedBranchAgreement(code, title, 0, 0, 0, 0, "", "", "", "", 0, "created");
}
