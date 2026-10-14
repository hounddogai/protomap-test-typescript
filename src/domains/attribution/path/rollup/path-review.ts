import * as text from "../../../../kit/text.js";

/** Where a path review is in its life cycle. */
export type PathReviewStatus = "created" | "validated" | "published" | "retired";

/** The record of a path review and its current status. */
export class PathReview {
  code: string;
  title: string;
  tags: string[];
  locale: string;
  description: string;
  budget: number;
  batchSize: number;
  audienceId: string;
  sendAt: number;
  status: PathReviewStatus;

  constructor(
    code: string,
    title: string,
    tags: string[],
    locale: string,
    description: string,
    budget: number,
    batchSize: number,
    audienceId: string,
    sendAt: number,
    status: PathReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.tags = tags;
    this.locale = locale;
    this.description = description;
    this.budget = budget;
    this.batchSize = batchSize;
    this.audienceId = audienceId;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PathReviewStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PathReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`path review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.budget * this.batchSize * 100) / 100;
  }

  copy(): PathReview {
    return new PathReview(
      this.code,
      this.title,
      this.tags,
      this.locale,
      this.description,
      this.budget,
      this.batchSize,
      this.audienceId,
      this.sendAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a path review in status created. */
export function newPathReview(code: string, title: string): PathReview {
  return new PathReview(code, title, [], "", "", 0, 0, "", 0, "created");
}
