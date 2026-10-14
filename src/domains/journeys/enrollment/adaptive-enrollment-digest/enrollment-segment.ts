import * as text from "../../../../kit/text.js";

/** Where a enrollment segment is in its life cycle. */
export type EnrollmentSegmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a enrollment segment and its current status. */
export class EnrollmentSegment {
  code: string;
  title: string;
  endsAt: number;
  batchSize: number;
  unit: string;
  archived: boolean;
  label: string;
  utmSource: string;
  maximum: number;
  threshold: number;
  status: EnrollmentSegmentStatus;

  constructor(
    code: string,
    title: string,
    endsAt: number,
    batchSize: number,
    unit: string,
    archived: boolean,
    label: string,
    utmSource: string,
    maximum: number,
    threshold: number,
    status: EnrollmentSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.endsAt = endsAt;
    this.batchSize = batchSize;
    this.unit = unit;
    this.archived = archived;
    this.label = label;
    this.utmSource = utmSource;
    this.maximum = maximum;
    this.threshold = threshold;
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

  canMoveTo(next: EnrollmentSegmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "closed";
      case "pending":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: EnrollmentSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`enrollment segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"enrollment segment"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.endsAt * this.maximum * 100) / 100;
  }

  copy(): EnrollmentSegment {
    return new EnrollmentSegment(
      this.code,
      this.title,
      this.endsAt,
      this.batchSize,
      this.unit,
      this.archived,
      this.label,
      this.utmSource,
      this.maximum,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a enrollment segment in status draft. */
export function newEnrollmentSegment(code: string, title: string): EnrollmentSegment {
  return new EnrollmentSegment(code, title, 0, 0, "", false, "", "", 0, 0, "draft");
}
