import * as text from "../../../../kit/text.js";

/** Where a window summary is in its life cycle. */
export type WindowSummaryStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a window summary and its current status. */
export class WindowSummary {
  code: string;
  label: string;
  channel: string;
  clicks: number;
  cohort: string;
  tags: string[];
  ceiling: number;
  endsAt: number;
  title: string;
  reviewer: string;
  locale: string;
  status: WindowSummaryStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    clicks: number,
    cohort: string,
    tags: string[],
    ceiling: number,
    endsAt: number,
    title: string,
    reviewer: string,
    locale: string,
    status: WindowSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.clicks = clicks;
    this.cohort = cohort;
    this.tags = tags;
    this.ceiling = ceiling;
    this.endsAt = endsAt;
    this.title = title;
    this.reviewer = reviewer;
    this.locale = locale;
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

  canMoveTo(next: WindowSummaryStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        return next === "running" || next === "failed";
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

  moveTo(next: WindowSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round(this.endsAt * this.clicks * 100) / 100;
  }

  copy(): WindowSummary {
    return new WindowSummary(
      this.code,
      this.label,
      this.channel,
      this.clicks,
      this.cohort,
      this.tags,
      this.ceiling,
      this.endsAt,
      this.title,
      this.reviewer,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a window summary in status new. */
export function newWindowSummary(code: string, label: string): WindowSummary {
  return new WindowSummary(code, label, "", 0, "", [], 0, 0, "", "", "", "new");
}
