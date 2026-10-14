/**
 * The strict macro quota records of support's macro work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict macro quota is in its life cycle. */
export type StrictMacroQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict macro quota, with what the planners need to act on it. */
export class StrictMacroQuota {
  code: string;
  label: string;
  graceDays: number;
  expiresAt: number;
  campaignRef: string;
  ceiling: number;
  category: string;
  status: StrictMacroQuotaStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    expiresAt: number,
    campaignRef: string,
    ceiling: number,
    category: string,
    status: StrictMacroQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.expiresAt = expiresAt;
    this.campaignRef = campaignRef;
    this.ceiling = ceiling;
    this.category = category;
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

  canMoveTo(next: StrictMacroQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictMacroQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict macro quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedLoad(): number {
    return Math.round((this.graceDays - this.expiresAt) * 100) / 100;
  }

  copy(): StrictMacroQuota {
    return new StrictMacroQuota(
      this.code,
      this.label,
      this.graceDays,
      this.expiresAt,
      this.campaignRef,
      this.ceiling,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict macro quota in status requested. */
export function newStrictMacroQuota(code: string, label: string): StrictMacroQuota {
  return new StrictMacroQuota(code, label, 0, 0, "", 0, "", "requested");
}
