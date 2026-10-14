import * as text from "../../../../kit/text.js";

/** Where a insight summary is in its life cycle. */
export type InsightSummaryStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A insight summary as the insight team keeps it. */
export class InsightSummary {
  code: string;
  label: string;
  country: string;
  ceiling: number;
  batchSize: number;
  attributes: Map<string, string>;
  region: string;
  archived: boolean;
  margin: number;
  status: InsightSummaryStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    ceiling: number,
    batchSize: number,
    attributes: Map<string, string>,
    region: string,
    archived: boolean,
    margin: number,
    status: InsightSummaryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.ceiling = ceiling;
    this.batchSize = batchSize;
    this.attributes = attributes;
    this.region = region;
    this.archived = archived;
    this.margin = margin;
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

  canMoveTo(next: InsightSummaryStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedValue(): number {
    return Math.round((this.batchSize - this.margin) * 100) / 100;
  }

  copy(): InsightSummary {
    return new InsightSummary(
      this.code,
      this.label,
      this.country,
      this.ceiling,
      this.batchSize,
      this.attributes,
      this.region,
      this.archived,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a insight summary in status open. */
export function newInsightSummary(code: string, label: string): InsightSummary {
  return new InsightSummary(code, label, "", 0, 0, new Map<string, string>(), "", false, 0, "open");
}
