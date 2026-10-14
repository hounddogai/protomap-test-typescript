import * as text from "../../../../kit/text.js";

/** Where a primary reply metric is in its life cycle. */
export type PrimaryReplyMetricStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a primary reply metric and its current status. */
export class PrimaryReplyMetric {
  code: string;
  label: string;
  archived: boolean;
  updatedAt: number;
  locale: string;
  budget: number;
  approved: boolean;
  summary: string;
  category: string;
  conversionRate: number;
  status: PrimaryReplyMetricStatus;

  constructor(
    code: string,
    label: string,
    archived: boolean,
    updatedAt: number,
    locale: string,
    budget: number,
    approved: boolean,
    summary: string,
    category: string,
    conversionRate: number,
    status: PrimaryReplyMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.archived = archived;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.budget = budget;
    this.approved = approved;
    this.summary = summary;
    this.category = category;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: PrimaryReplyMetricStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
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

  moveTo(next: PrimaryReplyMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary reply metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  weightedVolume(): number {
    return Math.round((this.conversionRate - this.updatedAt) * 100) / 100;
  }

  copy(): PrimaryReplyMetric {
    return new PrimaryReplyMetric(
      this.code,
      this.label,
      this.archived,
      this.updatedAt,
      this.locale,
      this.budget,
      this.approved,
      this.summary,
      this.category,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a primary reply metric in status new. */
export function newPrimaryReplyMetric(code: string, label: string): PrimaryReplyMetric {
  return new PrimaryReplyMetric(code, label, false, 0, "", 0, false, "", "", 0, "new");
}
