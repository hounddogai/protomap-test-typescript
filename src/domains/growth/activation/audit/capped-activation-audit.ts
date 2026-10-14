/**
 * The capped activation audit records of growth's activation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped activation audit is in its life cycle. */
export type CappedActivationAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A capped activation audit. Its code is unique within a tenant. */
export class CappedActivationAudit {
  code: string;
  label: string;
  sendAt: number;
  checksum: string;
  version: number;
  weight: number;
  cost: number;
  locale: string;
  campaignRef: string;
  status: CappedActivationAuditStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    checksum: string,
    version: number,
    weight: number,
    cost: number,
    locale: string,
    campaignRef: string,
    status: CappedActivationAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.checksum = checksum;
    this.version = version;
    this.weight = weight;
    this.cost = cost;
    this.locale = locale;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedActivationAuditStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedActivationAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped activation audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"capped activation audit"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round((this.weight - this.cost) * 100) / 100;
  }

  copy(): CappedActivationAudit {
    return new CappedActivationAudit(
      this.code,
      this.label,
      this.sendAt,
      this.checksum,
      this.version,
      this.weight,
      this.cost,
      this.locale,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a capped activation audit in status new. */
export function newCappedActivationAudit(code: string, label: string): CappedActivationAudit {
  return new CappedActivationAudit(code, label, 0, "", 0, 0, 0, "", "", "new");
}
