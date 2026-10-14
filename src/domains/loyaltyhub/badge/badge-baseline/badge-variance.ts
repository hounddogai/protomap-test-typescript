import * as text from "../../../../kit/text.js";

/** Where a badge variance is in its life cycle. */
export type BadgeVarianceStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a badge variance and its current status. */
export class BadgeVariance {
  code: string;
  name: string;
  conversionRate: number;
  impressions: number;
  audienceId: string;
  visible: boolean;
  title: string;
  reviewer: string;
  status: BadgeVarianceStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    impressions: number,
    audienceId: string,
    visible: boolean,
    title: string,
    reviewer: string,
    status: BadgeVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.impressions = impressions;
    this.audienceId = audienceId;
    this.visible = visible;
    this.title = title;
    this.reviewer = reviewer;
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

  canMoveTo(next: BadgeVarianceStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done";
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

  moveTo(next: BadgeVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedTotal(): number {
    return Math.round(this.conversionRate * this.impressions * 100) / 100;
  }

  copy(): BadgeVariance {
    return new BadgeVariance(
      this.code,
      this.name,
      this.conversionRate,
      this.impressions,
      this.audienceId,
      this.visible,
      this.title,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a badge variance in status new. */
export function newBadgeVariance(code: string, name: string): BadgeVariance {
  return new BadgeVariance(code, name, 0, 0, "", false, "", "", "new");
}
