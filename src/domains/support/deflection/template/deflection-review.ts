import * as text from "../../../../kit/text.js";

/** Where a deflection review is in its life cycle. */
export type DeflectionReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a deflection review and its current status. */
export class DeflectionReview {
  code: string;
  title: string;
  phone: string;
  segment: string;
  revision: number;
  region: string;
  archived: boolean;
  score: number;
  journeyId: string;
  conversionRate: number;
  status: DeflectionReviewStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    segment: string,
    revision: number,
    region: string,
    archived: boolean,
    score: number,
    journeyId: string,
    conversionRate: number,
    status: DeflectionReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.segment = segment;
    this.revision = revision;
    this.region = region;
    this.archived = archived;
    this.score = score;
    this.journeyId = journeyId;
    this.conversionRate = conversionRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: DeflectionReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        return next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: DeflectionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round(this.conversionRate * this.revision * 100) / 100;
  }

  copy(): DeflectionReview {
    return new DeflectionReview(
      this.code,
      this.title,
      this.phone,
      this.segment,
      this.revision,
      this.region,
      this.archived,
      this.score,
      this.journeyId,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a deflection review in status idle. */
export function newDeflectionReview(code: string, title: string): DeflectionReview {
  return new DeflectionReview(code, title, "", "", 0, "", false, 0, "", 0, "idle");
}
