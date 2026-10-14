import * as text from "../../../../kit/text.js";

/** Where a capped enrollment review is in its life cycle. */
export type CappedEnrollmentReviewStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped enrollment review. Its code is unique within a tenant. */
export class CappedEnrollmentReview {
  code: string;
  title: string;
  cohort: string;
  tags: string[];
  maximum: number;
  checksum: string;
  pinned: boolean;
  updatedAt: number;
  attributes: Map<string, string>;
  description: string;
  active: boolean;
  status: CappedEnrollmentReviewStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    tags: string[],
    maximum: number,
    checksum: string,
    pinned: boolean,
    updatedAt: number,
    attributes: Map<string, string>,
    description: string,
    active: boolean,
    status: CappedEnrollmentReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.tags = tags;
    this.maximum = maximum;
    this.checksum = checksum;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.description = description;
    this.active = active;
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

  canMoveTo(next: CappedEnrollmentReviewStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: CappedEnrollmentReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped enrollment review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveTotal(): number {
    return Math.round(this.maximum * this.updatedAt * 100) / 100;
  }

  copy(): CappedEnrollmentReview {
    return new CappedEnrollmentReview(
      this.code,
      this.title,
      this.cohort,
      this.tags,
      this.maximum,
      this.checksum,
      this.pinned,
      this.updatedAt,
      this.attributes,
      this.description,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped enrollment review in status open. */
export function newCappedEnrollmentReview(code: string, title: string): CappedEnrollmentReview {
  return new CappedEnrollmentReview(code, title, "", [], 0, "", false, 0, new Map<string, string>(), "", false, "open");
}
