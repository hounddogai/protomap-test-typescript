import * as text from "../../../../kit/text.js";

/** Where a primary sender segment is in its life cycle. */
export type PrimarySenderSegmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One primary sender segment, with what the planners need to act on it. */
export class PrimarySenderSegment {
  code: string;
  label: string;
  utmSource: string;
  source: string;
  windowDays: number;
  contactEmail: string;
  approved: boolean;
  status: PrimarySenderSegmentStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    source: string,
    windowDays: number,
    contactEmail: string,
    approved: boolean,
    status: PrimarySenderSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.source = source;
    this.windowDays = windowDays;
    this.contactEmail = contactEmail;
    this.approved = approved;
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

  canMoveTo(next: PrimarySenderSegmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimarySenderSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sender segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"primary sender segment"} ${this.code}`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): PrimarySenderSegment {
    return new PrimarySenderSegment(
      this.code,
      this.label,
      this.utmSource,
      this.source,
      this.windowDays,
      this.contactEmail,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a primary sender segment in status open. */
export function newPrimarySenderSegment(code: string, label: string): PrimarySenderSegment {
  return new PrimarySenderSegment(code, label, "", "", 0, "", false, "open");
}
