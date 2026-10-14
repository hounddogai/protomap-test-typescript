/**
 * The legacy placement audit records of adops's placement work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy placement audit is in its life cycle. */
export type LegacyPlacementAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a legacy placement audit and its current status. */
export class LegacyPlacementAudit {
  code: string;
  label: string;
  cohort: string;
  journeyId: string;
  phone: string;
  quantity: number;
  status: LegacyPlacementAuditStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    journeyId: string,
    phone: string,
    quantity: number,
    status: LegacyPlacementAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.phone = phone;
    this.quantity = quantity;
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

  canMoveTo(next: LegacyPlacementAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: LegacyPlacementAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy placement audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): LegacyPlacementAudit {
    return new LegacyPlacementAudit(
      this.code,
      this.label,
      this.cohort,
      this.journeyId,
      this.phone,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a legacy placement audit in status new. */
export function newLegacyPlacementAudit(code: string, label: string): LegacyPlacementAudit {
  return new LegacyPlacementAudit(code, label, "", "", "", 0, "new");
}
