import * as text from "../../../../kit/text.js";

/** Where a pacing review is in its life cycle. */
export type PacingReviewStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A pacing review. Its code is unique within a tenant. */
export class PacingReview {
  code: string;
  title: string;
  floorValue: number;
  windowDays: number;
  cohort: string;
  retries: number;
  channel: string;
  attributes: Map<string, string>;
  journeyId: string;
  createdAt: number;
  status: PacingReviewStatus;

  constructor(
    code: string,
    title: string,
    floorValue: number,
    windowDays: number,
    cohort: string,
    retries: number,
    channel: string,
    attributes: Map<string, string>,
    journeyId: string,
    createdAt: number,
    status: PacingReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.floorValue = floorValue;
    this.windowDays = windowDays;
    this.cohort = cohort;
    this.retries = retries;
    this.channel = channel;
    this.attributes = attributes;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
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

  canMoveTo(next: PacingReviewStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PacingReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"pacing review"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round(this.retries * this.windowDays * 100) / 100;
  }

  copy(): PacingReview {
    return new PacingReview(
      this.code,
      this.title,
      this.floorValue,
      this.windowDays,
      this.cohort,
      this.retries,
      this.channel,
      this.attributes,
      this.journeyId,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pacing review in status proposed. */
export function newPacingReview(code: string, title: string): PacingReview {
  return new PacingReview(code, title, 0, 0, "", 0, "", new Map<string, string>(), "", 0, "proposed");
}
