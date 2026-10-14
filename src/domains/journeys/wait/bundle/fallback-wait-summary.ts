import * as text from "../../../../kit/text.js";

/** Where a fallback wait summary is in its life cycle. */
export type FallbackWaitSummaryStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a fallback wait summary and its current status. */
export class FallbackWaitSummary {
  code: string;
  title: string;
  timezone: string;
  pinned: boolean;
  score: number;
  country: string;
  floorValue: number;
  tags: string[];
  openRate: number;
  graceDays: number;
  status: FallbackWaitSummaryStatus;

  constructor(
    code: string,
    title: string,
    timezone: string,
    pinned: boolean,
    score: number,
    country: string,
    floorValue: number,
    tags: string[],
    openRate: number,
    graceDays: number,
    status: FallbackWaitSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.timezone = timezone;
    this.pinned = pinned;
    this.score = score;
    this.country = country;
    this.floorValue = floorValue;
    this.tags = tags;
    this.openRate = openRate;
    this.graceDays = graceDays;
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

  canMoveTo(next: FallbackWaitSummaryStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
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

  moveTo(next: FallbackWaitSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback wait summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedValue(): number {
    return Math.round((this.graceDays - this.openRate) * 100) / 100;
  }

  copy(): FallbackWaitSummary {
    return new FallbackWaitSummary(
      this.code,
      this.title,
      this.timezone,
      this.pinned,
      this.score,
      this.country,
      this.floorValue,
      this.tags,
      this.openRate,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a fallback wait summary in status proposed. */
export function newFallbackWaitSummary(code: string, title: string): FallbackWaitSummary {
  return new FallbackWaitSummary(code, title, "", false, 0, "", 0, [], 0, 0, "proposed");
}
