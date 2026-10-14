import * as text from "../../../../kit/text.js";

/** Where a seasonal insight review is in its life cycle. */
export type SeasonalInsightReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A seasonal insight review as the insight team keeps it. */
export class SeasonalInsightReview {
  code: string;
  label: string;
  name: string;
  archived: boolean;
  audienceId: string;
  summary: string;
  openRate: number;
  expiresAt: number;
  category: string;
  status: SeasonalInsightReviewStatus;

  constructor(
    code: string,
    label: string,
    name: string,
    archived: boolean,
    audienceId: string,
    summary: string,
    openRate: number,
    expiresAt: number,
    category: string,
    status: SeasonalInsightReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.name = name;
    this.archived = archived;
    this.audienceId = audienceId;
    this.summary = summary;
    this.openRate = openRate;
    this.expiresAt = expiresAt;
    this.category = category;
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

  canMoveTo(next: SeasonalInsightReviewStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalInsightReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal insight review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  netTotal(): number {
    return Math.round(this.openRate * this.expiresAt * 100) / 100;
  }

  copy(): SeasonalInsightReview {
    return new SeasonalInsightReview(
      this.code,
      this.label,
      this.name,
      this.archived,
      this.audienceId,
      this.summary,
      this.openRate,
      this.expiresAt,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a seasonal insight review in status new. */
export function newSeasonalInsightReview(code: string, label: string): SeasonalInsightReview {
  return new SeasonalInsightReview(code, label, "", false, "", "", 0, 0, "", "new");
}
