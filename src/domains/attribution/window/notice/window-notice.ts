/**
 * The window notice records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window notice is in its life cycle. */
export type WindowNoticeStatus = "created" | "validated" | "published" | "retired";

/** A window notice as the window team keeps it. */
export class WindowNotice {
  code: string;
  title: string;
  ceiling: number;
  contactEmail: string;
  score: number;
  status: WindowNoticeStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    contactEmail: string,
    score: number,
    status: WindowNoticeStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.contactEmail = contactEmail;
    this.score = score;
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

  canMoveTo(next: WindowNoticeStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowNoticeStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window notice ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveTotal(): number {
    return Math.round(this.ceiling * this.score * 100) / 100;
  }

  copy(): WindowNotice {
    return new WindowNotice(this.code, this.title, this.ceiling, this.contactEmail, this.score, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a window notice in status created. */
export function newWindowNotice(code: string, title: string): WindowNotice {
  return new WindowNotice(code, title, 0, "", 0, "created");
}
