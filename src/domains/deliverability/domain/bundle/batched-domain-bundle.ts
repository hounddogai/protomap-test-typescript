/**
 * The batched domain bundle records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a batched domain bundle is in its life cycle. */
export type BatchedDomainBundleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A batched domain bundle. Its code is unique within a tenant. */
export class BatchedDomainBundle {
  code: string;
  title: string;
  contactEmail: string;
  campaignRef: string;
  maximum: number;
  status: BatchedDomainBundleStatus;

  constructor(
    code: string,
    title: string,
    contactEmail: string,
    campaignRef: string,
    maximum: number,
    status: BatchedDomainBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.contactEmail = contactEmail;
    this.campaignRef = campaignRef;
    this.maximum = maximum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedDomainBundleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: BatchedDomainBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched domain bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): BatchedDomainBundle {
    return new BatchedDomainBundle(
      this.code,
      this.title,
      this.contactEmail,
      this.campaignRef,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a batched domain bundle in status planned. */
export function newBatchedDomainBundle(code: string, title: string): BatchedDomainBundle {
  return new BatchedDomainBundle(code, title, "", "", 0, "planned");
}
