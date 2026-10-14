import * as text from "../../../../kit/text.js";

/** Where a legacy reward rule variance is in its life cycle. */
export type LegacyRewardRuleVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a legacy reward rule variance and its current status. */
export class LegacyRewardRuleVariance {
  code: string;
  name: string;
  summary: string;
  maximum: number;
  capacity: number;
  archived: boolean;
  category: string;
  variant: string;
  timezone: string;
  status: LegacyRewardRuleVarianceStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    maximum: number,
    capacity: number,
    archived: boolean,
    category: string,
    variant: string,
    timezone: string,
    status: LegacyRewardRuleVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.maximum = maximum;
    this.capacity = capacity;
    this.archived = archived;
    this.category = category;
    this.variant = variant;
    this.timezone = timezone;
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

  canMoveTo(next: LegacyRewardRuleVarianceStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyRewardRuleVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy reward rule variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy reward rule variance"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.capacity * this.maximum * 100) / 100;
  }

  copy(): LegacyRewardRuleVariance {
    return new LegacyRewardRuleVariance(
      this.code,
      this.name,
      this.summary,
      this.maximum,
      this.capacity,
      this.archived,
      this.category,
      this.variant,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a legacy reward rule variance in status requested. */
export function newLegacyRewardRuleVariance(code: string, name: string): LegacyRewardRuleVariance {
  return new LegacyRewardRuleVariance(code, name, "", 0, 0, false, "", "", "", "requested");
}
