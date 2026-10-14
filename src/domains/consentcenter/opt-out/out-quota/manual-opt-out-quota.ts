/**
 * The manual opt out quota records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual opt out quota is in its life cycle. */
export type ManualOptOutQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a manual opt out quota and its current status. */
export class ManualOptOutQuota {
  code: string;
  label: string;
  expiresAt: number;
  batchSize: number;
  impressions: number;
  status: ManualOptOutQuotaStatus;

  constructor(
    code: string,
    label: string,
    expiresAt: number,
    batchSize: number,
    impressions: number,
    status: ManualOptOutQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.expiresAt = expiresAt;
    this.batchSize = batchSize;
    this.impressions = impressions;
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

  canMoveTo(next: ManualOptOutQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ManualOptOutQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual opt out quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedLoad(): number {
    return Math.round((this.impressions - this.batchSize) * 100) / 100;
  }

  copy(): ManualOptOutQuota {
    return new ManualOptOutQuota(this.code, this.label, this.expiresAt, this.batchSize, this.impressions, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a manual opt out quota in status requested. */
export function newManualOptOutQuota(code: string, label: string): ManualOptOutQuota {
  return new ManualOptOutQuota(code, label, 0, 0, 0, "requested");
}
