/**
 * The manual tier allocation records of referral's tier work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual tier allocation is in its life cycle. */
export type ManualTierAllocationStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A manual tier allocation. Its code is unique within a tenant. */
export class ManualTierAllocation {
  code: string;
  label: string;
  updatedAt: number;
  region: string;
  channel: string;
  audienceId: string;
  unit: string;
  maximum: number;
  category: string;
  description: string;
  status: ManualTierAllocationStatus;

  constructor(
    code: string,
    label: string,
    updatedAt: number,
    region: string,
    channel: string,
    audienceId: string,
    unit: string,
    maximum: number,
    category: string,
    description: string,
    status: ManualTierAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.region = region;
    this.channel = channel;
    this.audienceId = audienceId;
    this.unit = unit;
    this.maximum = maximum;
    this.category = category;
    this.description = description;
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

  canMoveTo(next: ManualTierAllocationStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed";
      case "in_progress":
        return next === "completed";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: ManualTierAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual tier allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  effectiveValue(): number {
    return Math.round((this.updatedAt - this.maximum) * 100) / 100;
  }

  copy(): ManualTierAllocation {
    return new ManualTierAllocation(
      this.code,
      this.label,
      this.updatedAt,
      this.region,
      this.channel,
      this.audienceId,
      this.unit,
      this.maximum,
      this.category,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a manual tier allocation in status planned. */
export function newManualTierAllocation(code: string, label: string): ManualTierAllocation {
  return new ManualTierAllocation(code, label, 0, "", "", "", "", 0, "", "", "planned");
}
