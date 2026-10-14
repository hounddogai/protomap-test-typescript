import * as text from "../../../../kit/text.js";

/** Where a enrollment target is in its life cycle. */
export type EnrollmentTargetStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One enrollment target, with what the planners need to act on it. */
export class EnrollmentTarget {
  code: string;
  name: string;
  locale: string;
  maximum: number;
  checksum: string;
  score: number;
  category: string;
  frequencyCap: number;
  capacity: number;
  region: string;
  reviewer: string;
  status: EnrollmentTargetStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    maximum: number,
    checksum: string,
    score: number,
    category: string,
    frequencyCap: number,
    capacity: number,
    region: string,
    reviewer: string,
    status: EnrollmentTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.maximum = maximum;
    this.checksum = checksum;
    this.score = score;
    this.category = category;
    this.frequencyCap = frequencyCap;
    this.capacity = capacity;
    this.region = region;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: EnrollmentTargetStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"enrollment target"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.maximum * this.score * 100) / 100;
  }

  copy(): EnrollmentTarget {
    return new EnrollmentTarget(
      this.code,
      this.name,
      this.locale,
      this.maximum,
      this.checksum,
      this.score,
      this.category,
      this.frequencyCap,
      this.capacity,
      this.region,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a enrollment target in status draft. */
export function newEnrollmentTarget(code: string, name: string): EnrollmentTarget {
  return new EnrollmentTarget(code, name, "", 0, "", 0, "", 0, 0, "", "", "draft");
}
