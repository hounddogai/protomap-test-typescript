/**
 * The approval mapping records of social's approval work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval mapping is in its life cycle. */
export type ApprovalMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** One approval mapping, with what the planners need to act on it. */
export class ApprovalMapping {
  code: string;
  label: string;
  capacity: number;
  amount: number;
  conversionRate: number;
  createdAt: number;
  budget: number;
  rate: number;
  ceiling: number;
  utmSource: string;
  status: ApprovalMappingStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    amount: number,
    conversionRate: number,
    createdAt: number,
    budget: number,
    rate: number,
    ceiling: number,
    utmSource: string,
    status: ApprovalMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.amount = amount;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.budget = budget;
    this.rate = rate;
    this.ceiling = ceiling;
    this.utmSource = utmSource;
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

  canMoveTo(next: ApprovalMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: ApprovalMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveTotal(): number {
    return Math.round((this.conversionRate - this.rate) * 100) / 100;
  }

  copy(): ApprovalMapping {
    return new ApprovalMapping(
      this.code,
      this.label,
      this.capacity,
      this.amount,
      this.conversionRate,
      this.createdAt,
      this.budget,
      this.rate,
      this.ceiling,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a approval mapping in status requested. */
export function newApprovalMapping(code: string, label: string): ApprovalMapping {
  return new ApprovalMapping(code, label, 0, 0, 0, 0, 0, 0, 0, "", "requested");
}
