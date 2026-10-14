/**
 * The batched sla audit records of support's sla work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched sla audit is in its life cycle. */
export type BatchedSlaAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A batched sla audit. Its code is unique within a tenant. */
export class BatchedSlaAudit {
  code: string;
  name: string;
  archived: boolean;
  expiresAt: number;
  reviewer: string;
  sendAt: number;
  cost: number;
  createdAt: number;
  floorValue: number;
  amount: number;
  externalRef: string;
  status: BatchedSlaAuditStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    expiresAt: number,
    reviewer: string,
    sendAt: number,
    cost: number,
    createdAt: number,
    floorValue: number,
    amount: number,
    externalRef: string,
    status: BatchedSlaAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.expiresAt = expiresAt;
    this.reviewer = reviewer;
    this.sendAt = sendAt;
    this.cost = cost;
    this.createdAt = createdAt;
    this.floorValue = floorValue;
    this.amount = amount;
    this.externalRef = externalRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedSlaAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: BatchedSlaAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched sla audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedValue(): number {
    return Math.round(this.amount * this.createdAt * 100) / 100;
  }

  copy(): BatchedSlaAudit {
    return new BatchedSlaAudit(
      this.code,
      this.name,
      this.archived,
      this.expiresAt,
      this.reviewer,
      this.sendAt,
      this.cost,
      this.createdAt,
      this.floorValue,
      this.amount,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a batched sla audit in status requested. */
export function newBatchedSlaAudit(code: string, name: string): BatchedSlaAudit {
  return new BatchedSlaAudit(code, name, false, 0, "", 0, 0, 0, 0, 0, "", "requested");
}
