import * as text from "../../../../kit/text.js";

/** Where a tiered badge summary is in its life cycle. */
export type TieredBadgeSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a tiered badge summary and its current status. */
export class TieredBadgeSummary {
  code: string;
  title: string;
  tags: string[];
  attempts: number;
  priority: number;
  bid: number;
  audienceId: string;
  impressions: number;
  status: TieredBadgeSummaryStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    attempts: number,
    priority: number,
    bid: number,
    audienceId: string,
    impressions: number,
    status: TieredBadgeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.attempts = attempts;
    this.priority = priority;
    this.bid = bid;
    this.audienceId = audienceId;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredBadgeSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredBadgeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered badge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered badge summary"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.impressions + this.priority) * 100) / 100;
  }

  copy(): TieredBadgeSummary {
    return new TieredBadgeSummary(
      this.code,
      this.title,
      this.tags,
      this.attempts,
      this.priority,
      this.bid,
      this.audienceId,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a tiered badge summary in status open. */
export function newTieredBadgeSummary(code: string, title: string): TieredBadgeSummary {
  return new TieredBadgeSummary(code, title, [], 0, 0, 0, "", 0, "open");
}
