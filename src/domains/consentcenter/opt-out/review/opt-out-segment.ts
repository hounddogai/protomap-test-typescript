import * as text from "../../../../kit/text.js";

/** Where a opt out segment is in its life cycle. */
export type OptOutSegmentStatus = "new" | "queued" | "running" | "done" | "failed";

/** One opt out segment, with what the planners need to act on it. */
export class OptOutSegment {
  code: string;
  title: string;
  cohort: string;
  contactEmail: string;
  ceiling: number;
  description: string;
  status: OptOutSegmentStatus;

  constructor(
    code: string,
    title: string,
    cohort: string,
    contactEmail: string,
    ceiling: number,
    description: string,
    status: OptOutSegmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cohort = cohort;
    this.contactEmail = contactEmail;
    this.ceiling = ceiling;
    this.description = description;
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

  canMoveTo(next: OptOutSegmentStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: OptOutSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"opt out segment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): OptOutSegment {
    return new OptOutSegment(
      this.code,
      this.title,
      this.cohort,
      this.contactEmail,
      this.ceiling,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a opt out segment in status new. */
export function newOptOutSegment(code: string, title: string): OptOutSegment {
  return new OptOutSegment(code, title, "", "", 0, "", "new");
}
