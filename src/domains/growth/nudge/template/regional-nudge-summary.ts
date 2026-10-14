import * as text from "../../../../kit/text.js";

/** Where a regional nudge summary is in its life cycle. */
export type RegionalNudgeSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A regional nudge summary. Its code is unique within a tenant. */
export class RegionalNudgeSummary {
  code: string;
  title: string;
  visible: boolean;
  priority: number;
  bid: number;
  tags: string[];
  impressions: number;
  limit: number;
  conversionRate: number;
  status: RegionalNudgeSummaryStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    priority: number,
    bid: number,
    tags: string[],
    impressions: number,
    limit: number,
    conversionRate: number,
    status: RegionalNudgeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.priority = priority;
    this.bid = bid;
    this.tags = tags;
    this.impressions = impressions;
    this.limit = limit;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: RegionalNudgeSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalNudgeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional nudge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional nudge summary"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveVolume(): number {
    return Math.round((this.limit + this.impressions) * 100) / 100;
  }

  copy(): RegionalNudgeSummary {
    return new RegionalNudgeSummary(
      this.code,
      this.title,
      this.visible,
      this.priority,
      this.bid,
      this.tags,
      this.impressions,
      this.limit,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a regional nudge summary in status planned. */
export function newRegionalNudgeSummary(code: string, title: string): RegionalNudgeSummary {
  return new RegionalNudgeSummary(code, title, false, 0, 0, [], 0, 0, 0, "planned");
}
