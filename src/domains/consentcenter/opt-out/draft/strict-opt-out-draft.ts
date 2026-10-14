/**
 * The strict opt out draft records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict opt out draft is in its life cycle. */
export type StrictOptOutDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One strict opt out draft, with what the planners need to act on it. */
export class StrictOptOutDraft {
  code: string;
  title: string;
  category: string;
  channel: string;
  updatedAt: number;
  status: StrictOptOutDraftStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    channel: string,
    updatedAt: number,
    status: StrictOptOutDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.channel = channel;
    this.updatedAt = updatedAt;
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

  canMoveTo(next: StrictOptOutDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: StrictOptOutDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict opt out draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): StrictOptOutDraft {
    return new StrictOptOutDraft(this.code, this.title, this.category, this.channel, this.updatedAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a strict opt out draft in status draft. */
export function newStrictOptOutDraft(code: string, title: string): StrictOptOutDraft {
  return new StrictOptOutDraft(code, title, "", "", 0, "draft");
}
