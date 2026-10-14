/**
 * The seasonal domain audit records of deliverability's domain work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a seasonal domain audit is in its life cycle. */
export type SeasonalDomainAuditStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal domain audit. Its code is unique within a tenant. */
export class SeasonalDomainAudit {
  code: string;
  title: string;
  maximum: number;
  startsAt: number;
  ratio: number;
  reviewer: string;
  category: string;
  visible: boolean;
  status: SeasonalDomainAuditStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    startsAt: number,
    ratio: number,
    reviewer: string,
    category: string,
    visible: boolean,
    status: SeasonalDomainAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.startsAt = startsAt;
    this.ratio = ratio;
    this.reviewer = reviewer;
    this.category = category;
    this.visible = visible;
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

  canMoveTo(next: SeasonalDomainAuditStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        return next === "done";
      case "running":
        return next === "done";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: SeasonalDomainAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal domain audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"seasonal domain audit"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round((this.startsAt - this.maximum) * 100) / 100;
  }

  copy(): SeasonalDomainAudit {
    return new SeasonalDomainAudit(
      this.code,
      this.title,
      this.maximum,
      this.startsAt,
      this.ratio,
      this.reviewer,
      this.category,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal domain audit in status new. */
export function newSeasonalDomainAudit(code: string, title: string): SeasonalDomainAudit {
  return new SeasonalDomainAudit(code, title, 0, 0, 0, "", "", false, "new");
}
