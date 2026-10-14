import * as text from "../../../../kit/text.js";

/** Where a adaptive reputation summary is in its life cycle. */
export type AdaptiveReputationSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A adaptive reputation summary as the reputation team keeps it. */
export class AdaptiveReputationSummary {
  code: string;
  title: string;
  locale: string;
  attributes: Map<string, string>;
  cohort: string;
  channel: string;
  openRate: number;
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  score: number;
  status: AdaptiveReputationSummaryStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    attributes: Map<string, string>,
    cohort: string,
    channel: string,
    openRate: number,
    pinned: boolean,
    archived: boolean,
    createdAt: number,
    score: number,
    status: AdaptiveReputationSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.attributes = attributes;
    this.cohort = cohort;
    this.channel = channel;
    this.openRate = openRate;
    this.pinned = pinned;
    this.archived = archived;
    this.createdAt = createdAt;
    this.score = score;
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

  canMoveTo(next: AdaptiveReputationSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: AdaptiveReputationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive reputation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"adaptive reputation summary"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedLoad(): number {
    return Math.round((this.score + this.openRate) * 100) / 100;
  }

  copy(): AdaptiveReputationSummary {
    return new AdaptiveReputationSummary(
      this.code,
      this.title,
      this.locale,
      this.attributes,
      this.cohort,
      this.channel,
      this.openRate,
      this.pinned,
      this.archived,
      this.createdAt,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive reputation summary in status open. */
export function newAdaptiveReputationSummary(code: string, title: string): AdaptiveReputationSummary {
  return new AdaptiveReputationSummary(
    code,
    title,
    "",
    new Map<string, string>(),
    "",
    "",
    0,
    false,
    false,
    0,
    0,
    "open",
  );
}
