import * as text from "../../../../kit/text.js";

/** Where a reply window is in its life cycle. */
export type ReplyWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One reply window, with what the planners need to act on it. */
export class ReplyWindow {
  code: string;
  title: string;
  graceDays: number;
  label: string;
  approved: boolean;
  version: number;
  journeyId: string;
  status: ReplyWindowStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    label: string,
    approved: boolean,
    version: number,
    journeyId: string,
    status: ReplyWindowStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.label = label;
    this.approved = approved;
    this.version = version;
    this.journeyId = journeyId;
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

  canMoveTo(next: ReplyWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ReplyWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedLoad(): number {
    return Math.round((this.graceDays + this.version) * 100) / 100;
  }

  copy(): ReplyWindow {
    return new ReplyWindow(
      this.code,
      this.title,
      this.graceDays,
      this.label,
      this.approved,
      this.version,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a reply window in status open. */
export function newReplyWindow(code: string, title: string): ReplyWindow {
  return new ReplyWindow(code, title, 0, "", false, 0, "", "open");
}
