/**
 * The insight review records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight review is in its life cycle. */
export type InsightReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a insight review and its current status. */
export class InsightReview {
  code: string;
  title: string;
  source: string;
  cohort: string;
  utmSource: string;
  clicks: number;
  windowDays: number;
  name: string;
  budget: number;
  description: string;
  status: InsightReviewStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    cohort: string,
    utmSource: string,
    clicks: number,
    windowDays: number,
    name: string,
    budget: number,
    description: string,
    status: InsightReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.cohort = cohort;
    this.utmSource = utmSource;
    this.clicks = clicks;
    this.windowDays = windowDays;
    this.name = name;
    this.budget = budget;
    this.description = description;
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

  canMoveTo(next: InsightReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"insight review"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.clicks * this.budget * 100) / 100;
  }

  copy(): InsightReview {
    return new InsightReview(
      this.code,
      this.title,
      this.source,
      this.cohort,
      this.utmSource,
      this.clicks,
      this.windowDays,
      this.name,
      this.budget,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a insight review in status new. */
export function newInsightReview(code: string, title: string): InsightReview {
  return new InsightReview(code, title, "", "", "", 0, 0, "", 0, "", "new");
}
