import * as text from "../../../../kit/text.js";

/** Where a fallback nudge summary is in its life cycle. */
export type FallbackNudgeSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fallback nudge summary, with what the planners need to act on it. */
export class FallbackNudgeSummary {
  code: string;
  label: string;
  weight: number;
  ratio: number;
  locale: string;
  checksum: string;
  unit: string;
  campaignRef: string;
  tags: string[];
  status: FallbackNudgeSummaryStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    ratio: number,
    locale: string,
    checksum: string,
    unit: string,
    campaignRef: string,
    tags: string[],
    status: FallbackNudgeSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.ratio = ratio;
    this.locale = locale;
    this.checksum = checksum;
    this.unit = unit;
    this.campaignRef = campaignRef;
    this.tags = tags;
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

  canMoveTo(next: FallbackNudgeSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "resolved";
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: FallbackNudgeSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback nudge summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  netLoad(): number {
    return Math.round((this.weight + this.ratio) * 100) / 100;
  }

  copy(): FallbackNudgeSummary {
    return new FallbackNudgeSummary(
      this.code,
      this.label,
      this.weight,
      this.ratio,
      this.locale,
      this.checksum,
      this.unit,
      this.campaignRef,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback nudge summary in status open. */
export function newFallbackNudgeSummary(code: string, label: string): FallbackNudgeSummary {
  return new FallbackNudgeSummary(code, label, 0, 0, "", "", "", "", [], "open");
}
