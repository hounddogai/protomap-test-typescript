/**
 * The pending complaint audit records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending complaint audit is in its life cycle. */
export type PendingComplaintAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One pending complaint audit, with what the planners need to act on it. */
export class PendingComplaintAudit {
  code: string;
  label: string;
  visible: boolean;
  batchSize: number;
  version: number;
  locale: string;
  category: string;
  name: string;
  conversionRate: number;
  startsAt: number;
  status: PendingComplaintAuditStatus;

  constructor(
    code: string,
    label: string,
    visible: boolean,
    batchSize: number,
    version: number,
    locale: string,
    category: string,
    name: string,
    conversionRate: number,
    startsAt: number,
    status: PendingComplaintAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.visible = visible;
    this.batchSize = batchSize;
    this.version = version;
    this.locale = locale;
    this.category = category;
    this.name = name;
    this.conversionRate = conversionRate;
    this.startsAt = startsAt;
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

  canMoveTo(next: PendingComplaintAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingComplaintAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending complaint audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveTotal(): number {
    return Math.round(this.batchSize * this.version * 100) / 100;
  }

  copy(): PendingComplaintAudit {
    return new PendingComplaintAudit(
      this.code,
      this.label,
      this.visible,
      this.batchSize,
      this.version,
      this.locale,
      this.category,
      this.name,
      this.conversionRate,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending complaint audit in status proposed. */
export function newPendingComplaintAudit(code: string, label: string): PendingComplaintAudit {
  return new PendingComplaintAudit(code, label, false, 0, 0, "", "", "", 0, 0, "proposed");
}
