/**
 * The legacy csat quota records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy csat quota is in its life cycle. */
export type LegacyCsatQuotaStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A legacy csat quota. Its code is unique within a tenant. */
export class LegacyCsatQuota {
  code: string;
  label: string;
  sendAt: number;
  name: string;
  attempts: number;
  campaignRef: string;
  status: LegacyCsatQuotaStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    name: string,
    attempts: number,
    campaignRef: string,
    status: LegacyCsatQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.name = name;
    this.attempts = attempts;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyCsatQuotaStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyCsatQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy csat quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedTotal(): number {
    return Math.round((this.sendAt - this.attempts) * 100) / 100;
  }

  copy(): LegacyCsatQuota {
    return new LegacyCsatQuota(
      this.code,
      this.label,
      this.sendAt,
      this.name,
      this.attempts,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy csat quota in status proposed. */
export function newLegacyCsatQuota(code: string, label: string): LegacyCsatQuota {
  return new LegacyCsatQuota(code, label, 0, "", 0, "", "proposed");
}
