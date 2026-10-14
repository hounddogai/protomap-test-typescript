import * as text from "../../../../kit/text.js";

/** Where a manual creative summary is in its life cycle. */
export type ManualCreativeSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** A manual creative summary as the creative team keeps it. */
export class ManualCreativeSummary {
  code: string;
  title: string;
  category: string;
  bid: number;
  name: string;
  impressions: number;
  ratio: number;
  durationMinutes: number;
  utmSource: string;
  status: ManualCreativeSummaryStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    bid: number,
    name: string,
    impressions: number,
    ratio: number,
    durationMinutes: number,
    utmSource: string,
    status: ManualCreativeSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.bid = bid;
    this.name = name;
    this.impressions = impressions;
    this.ratio = ratio;
    this.durationMinutes = durationMinutes;
    this.utmSource = utmSource;
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

  canMoveTo(next: ManualCreativeSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "failed";
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ManualCreativeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual creative summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"manual creative summary"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.ratio * this.impressions * 100) / 100;
  }

  copy(): ManualCreativeSummary {
    return new ManualCreativeSummary(
      this.code,
      this.title,
      this.category,
      this.bid,
      this.name,
      this.impressions,
      this.ratio,
      this.durationMinutes,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a manual creative summary in status new. */
export function newManualCreativeSummary(code: string, title: string): ManualCreativeSummary {
  return new ManualCreativeSummary(code, title, "", 0, "", 0, 0, 0, "", "new");
}
