import * as text from "../../../../kit/text.js";

/** Where a global double opt in notice is in its life cycle. */
export type GlobalDoubleOptInNoticeStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One global double opt in notice, with what the planners need to act on it. */
export class GlobalDoubleOptInNotice {
  code: string;
  title: string;
  capacity: number;
  contactEmail: string;
  threshold: number;
  attempts: number;
  minimum: number;
  archived: boolean;
  status: GlobalDoubleOptInNoticeStatus;

  constructor(
    code: string,
    title: string,
    capacity: number,
    contactEmail: string,
    threshold: number,
    attempts: number,
    minimum: number,
    archived: boolean,
    status: GlobalDoubleOptInNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.capacity = capacity;
    this.contactEmail = contactEmail;
    this.threshold = threshold;
    this.attempts = attempts;
    this.minimum = minimum;
    this.archived = archived;
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

  canMoveTo(next: GlobalDoubleOptInNoticeStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: GlobalDoubleOptInNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global double opt in notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveValue(): number {
    return Math.round((this.minimum - this.threshold) * 100) / 100;
  }

  copy(): GlobalDoubleOptInNotice {
    return new GlobalDoubleOptInNotice(
      this.code,
      this.title,
      this.capacity,
      this.contactEmail,
      this.threshold,
      this.attempts,
      this.minimum,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global double opt in notice in status open. */
export function newGlobalDoubleOptInNotice(code: string, title: string): GlobalDoubleOptInNotice {
  return new GlobalDoubleOptInNotice(code, title, 0, "", 0, 0, 0, false, "open");
}
