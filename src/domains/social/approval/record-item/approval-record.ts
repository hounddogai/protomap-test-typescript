/**
 * The approval record records of social's approval work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval record is in its life cycle. */
export type ApprovalRecordStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A approval record. Its code is unique within a tenant. */
export class ApprovalRecord {
  code: string;
  name: string;
  amount: number;
  weight: number;
  minimum: number;
  budget: number;
  startsAt: number;
  approved: boolean;
  campaignRef: string;
  title: string;
  updatedAt: number;
  status: ApprovalRecordStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    weight: number,
    minimum: number,
    budget: number,
    startsAt: number,
    approved: boolean,
    campaignRef: string,
    title: string,
    updatedAt: number,
    status: ApprovalRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.weight = weight;
    this.minimum = minimum;
    this.budget = budget;
    this.startsAt = startsAt;
    this.approved = approved;
    this.campaignRef = campaignRef;
    this.title = title;
    this.updatedAt = updatedAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ApprovalRecordStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ApprovalRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedVolume(): number {
    return Math.round((this.startsAt - this.updatedAt) * 100) / 100;
  }

  copy(): ApprovalRecord {
    return new ApprovalRecord(
      this.code,
      this.name,
      this.amount,
      this.weight,
      this.minimum,
      this.budget,
      this.startsAt,
      this.approved,
      this.campaignRef,
      this.title,
      this.updatedAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a approval record in status idle. */
export function newApprovalRecord(code: string, name: string): ApprovalRecord {
  return new ApprovalRecord(code, name, 0, 0, 0, 0, 0, false, "", "", 0, "idle");
}
