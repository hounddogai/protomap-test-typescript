/**
 * The capped suppression plan records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped suppression plan is in its life cycle. */
export type CappedSuppressionPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped suppression plan as the suppression team keeps it. */
export class CappedSuppressionPlan {
  code: string;
  label: string;
  threshold: number;
  revision: number;
  maximum: number;
  archived: boolean;
  unit: string;
  reviewer: string;
  updatedAt: number;
  locale: string;
  impressions: number;
  status: CappedSuppressionPlanStatus;

  constructor(
    code: string,
    label: string,
    threshold: number,
    revision: number,
    maximum: number,
    archived: boolean,
    unit: string,
    reviewer: string,
    updatedAt: number,
    locale: string,
    impressions: number,
    status: CappedSuppressionPlanStatus,
  ) {
    this.code = code;
    this.label = label;
    this.threshold = threshold;
    this.revision = revision;
    this.maximum = maximum;
    this.archived = archived;
    this.unit = unit;
    this.reviewer = reviewer;
    this.updatedAt = updatedAt;
    this.locale = locale;
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

  canMoveTo(next: CappedSuppressionPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CappedSuppressionPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped suppression plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"capped suppression plan"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.maximum * this.impressions * 100) / 100;
  }

  copy(): CappedSuppressionPlan {
    return new CappedSuppressionPlan(
      this.code,
      this.label,
      this.threshold,
      this.revision,
      this.maximum,
      this.archived,
      this.unit,
      this.reviewer,
      this.updatedAt,
      this.locale,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a capped suppression plan in status requested. */
export function newCappedSuppressionPlan(code: string, label: string): CappedSuppressionPlan {
  return new CappedSuppressionPlan(code, label, 0, 0, 0, false, "", "", 0, "", 0, "requested");
}
