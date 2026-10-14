/**
 * The seasonal csat audit records of support's csat work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal csat audit is in its life cycle. */
export type SeasonalCsatAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal csat audit. Its code is unique within a tenant. */
export class SeasonalCsatAudit {
  code: string;
  label: string;
  margin: number;
  currency: string;
  discount: number;
  name: string;
  frequencyCap: number;
  conversionRate: number;
  sendAt: number;
  version: number;
  status: SeasonalCsatAuditStatus;

  constructor(
    code: string,
    label: string,
    margin: number,
    currency: string,
    discount: number,
    name: string,
    frequencyCap: number,
    conversionRate: number,
    sendAt: number,
    version: number,
    status: SeasonalCsatAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.margin = margin;
    this.currency = currency;
    this.discount = discount;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.conversionRate = conversionRate;
    this.sendAt = sendAt;
    this.version = version;
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

  canMoveTo(next: SeasonalCsatAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalCsatAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal csat audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round(this.conversionRate * this.frequencyCap * 100) / 100;
  }

  copy(): SeasonalCsatAudit {
    return new SeasonalCsatAudit(
      this.code,
      this.label,
      this.margin,
      this.currency,
      this.discount,
      this.name,
      this.frequencyCap,
      this.conversionRate,
      this.sendAt,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a seasonal csat audit in status draft. */
export function newSeasonalCsatAudit(code: string, label: string): SeasonalCsatAudit {
  return new SeasonalCsatAudit(code, label, 0, "", 0, "", 0, 0, 0, 0, "draft");
}
