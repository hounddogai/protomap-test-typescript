/**
 * The rolling reply batch records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a rolling reply batch is in its life cycle. */
export type RollingReplyBatchStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A rolling reply batch as the reply team keeps it. */
export class RollingReplyBatch {
  code: string;
  label: string;
  campaignRef: string;
  title: string;
  region: string;
  checksum: string;
  weight: number;
  impressions: number;
  active: boolean;
  status: RollingReplyBatchStatus;

  constructor(
    code: string,
    label: string,
    campaignRef: string,
    title: string,
    region: string,
    checksum: string,
    weight: number,
    impressions: number,
    active: boolean,
    status: RollingReplyBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.campaignRef = campaignRef;
    this.title = title;
    this.region = region;
    this.checksum = checksum;
    this.weight = weight;
    this.impressions = impressions;
    this.active = active;
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

  canMoveTo(next: RollingReplyBatchStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: RollingReplyBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`rolling reply batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedTotal(): number {
    return Math.round((this.impressions - this.weight) * 100) / 100;
  }

  copy(): RollingReplyBatch {
    return new RollingReplyBatch(
      this.code,
      this.label,
      this.campaignRef,
      this.title,
      this.region,
      this.checksum,
      this.weight,
      this.impressions,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a rolling reply batch in status draft. */
export function newRollingReplyBatch(code: string, label: string): RollingReplyBatch {
  return new RollingReplyBatch(code, label, "", "", "", "", 0, 0, false, "draft");
}
