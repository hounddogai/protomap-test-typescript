import * as text from "../../../../kit/text.js";

/** Where a scheduled preference segment is in its life cycle. */
export type ScheduledPreferenceSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a scheduled preference segment and its current status. */
export class ScheduledPreferenceSegment {
  code: string;
  title: string;
  margin: number;
  discount: number;
  timezone: string;
  externalRef: string;
  archived: boolean;
  category: string;
  status: ScheduledPreferenceSegmentStatus;

  constructor(
    code: string,
    title: string,
    margin: number,
    discount: number,
    timezone: string,
    externalRef: string,
    archived: boolean,
    category: string,
    status: ScheduledPreferenceSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.margin = margin;
    this.discount = discount;
    this.timezone = timezone;
    this.externalRef = externalRef;
    this.archived = archived;
    this.category = category;
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

  canMoveTo(next: ScheduledPreferenceSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
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

  moveTo(next: ScheduledPreferenceSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled preference segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedVolume(): number {
    return Math.round((this.margin + this.discount) * 100) / 100;
  }

  copy(): ScheduledPreferenceSegment {
    return new ScheduledPreferenceSegment(
      this.code,
      this.title,
      this.margin,
      this.discount,
      this.timezone,
      this.externalRef,
      this.archived,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled preference segment in status open. */
export function newScheduledPreferenceSegment(code: string, title: string): ScheduledPreferenceSegment {
  return new ScheduledPreferenceSegment(code, title, 0, 0, "", "", false, "", "open");
}
