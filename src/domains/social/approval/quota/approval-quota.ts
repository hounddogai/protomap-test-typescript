/**
 * The approval quota records of social's approval work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a approval quota is in its life cycle. */
export type ApprovalQuotaStatus = "created" | "validated" | "published" | "retired";

/** A approval quota as the approval team keeps it. */
export class ApprovalQuota {
  code: string;
  label: string;
  impressions: number;
  sendAt: number;
  name: string;
  graceDays: number;
  durationMinutes: number;
  revision: number;
  checksum: string;
  status: ApprovalQuotaStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    sendAt: number,
    name: string,
    graceDays: number,
    durationMinutes: number,
    revision: number,
    checksum: string,
    status: ApprovalQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.sendAt = sendAt;
    this.name = name;
    this.graceDays = graceDays;
    this.durationMinutes = durationMinutes;
    this.revision = revision;
    this.checksum = checksum;
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

  canMoveTo(next: ApprovalQuotaStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round(this.graceDays * this.impressions * 100) / 100;
  }

  copy(): ApprovalQuota {
    return new ApprovalQuota(
      this.code,
      this.label,
      this.impressions,
      this.sendAt,
      this.name,
      this.graceDays,
      this.durationMinutes,
      this.revision,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a approval quota in status created. */
export function newApprovalQuota(code: string, label: string): ApprovalQuota {
  return new ApprovalQuota(code, label, 0, 0, "", 0, 0, 0, "", "created");
}
