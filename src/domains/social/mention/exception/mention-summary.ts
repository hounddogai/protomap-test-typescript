import * as text from "../../../../kit/text.js";

/** Where a mention summary is in its life cycle. */
export type MentionSummaryStatus = "created" | "validated" | "published" | "retired";

/** One mention summary, with what the planners need to act on it. */
export class MentionSummary {
  code: string;
  title: string;
  graceDays: number;
  capacity: number;
  description: string;
  contactEmail: string;
  priority: number;
  variant: string;
  status: MentionSummaryStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    capacity: number,
    description: string,
    contactEmail: string,
    priority: number,
    variant: string,
    status: MentionSummaryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.capacity = capacity;
    this.description = description;
    this.contactEmail = contactEmail;
    this.priority = priority;
    this.variant = variant;
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

  canMoveTo(next: MentionSummaryStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.graceDays + this.capacity) * 100) / 100;
  }

  copy(): MentionSummary {
    return new MentionSummary(
      this.code,
      this.title,
      this.graceDays,
      this.capacity,
      this.description,
      this.contactEmail,
      this.priority,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a mention summary in status created. */
export function newMentionSummary(code: string, title: string): MentionSummary {
  return new MentionSummary(code, title, 0, 0, "", "", 0, "", "created");
}
