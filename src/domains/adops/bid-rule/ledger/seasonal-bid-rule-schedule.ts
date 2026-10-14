import * as text from "../../../../kit/text.js";

/** Where a seasonal bid rule schedule is in its life cycle. */
export type SeasonalBidRuleScheduleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A seasonal bid rule schedule. Its code is unique within a tenant. */
export class SeasonalBidRuleSchedule {
  code: string;
  name: string;
  summary: string;
  locale: string;
  conversionRate: number;
  priority: number;
  durationMinutes: number;
  campaignRef: string;
  batchSize: number;
  category: string;
  ratio: number;
  status: SeasonalBidRuleScheduleStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    locale: string,
    conversionRate: number,
    priority: number,
    durationMinutes: number,
    campaignRef: string,
    batchSize: number,
    category: string,
    ratio: number,
    status: SeasonalBidRuleScheduleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.locale = locale;
    this.conversionRate = conversionRate;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.campaignRef = campaignRef;
    this.batchSize = batchSize;
    this.category = category;
    this.ratio = ratio;
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

  canMoveTo(next: SeasonalBidRuleScheduleStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalBidRuleScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal bid rule schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveVolume(): number {
    return Math.round((this.priority - this.durationMinutes) * 100) / 100;
  }

  copy(): SeasonalBidRuleSchedule {
    return new SeasonalBidRuleSchedule(
      this.code,
      this.name,
      this.summary,
      this.locale,
      this.conversionRate,
      this.priority,
      this.durationMinutes,
      this.campaignRef,
      this.batchSize,
      this.category,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a seasonal bid rule schedule in status draft. */
export function newSeasonalBidRuleSchedule(code: string, name: string): SeasonalBidRuleSchedule {
  return new SeasonalBidRuleSchedule(code, name, "", "", 0, 0, 0, "", 0, "", 0, "draft");
}
