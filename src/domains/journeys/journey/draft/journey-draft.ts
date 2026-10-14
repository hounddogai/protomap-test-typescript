/**
 * The journey draft records of journeys's journey work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a journey draft is in its life cycle. */
export type JourneyDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A journey draft as the journey team keeps it. */
export class JourneyDraft {
  code: string;
  label: string;
  channel: string;
  pinned: boolean;
  updatedAt: number;
  locale: string;
  status: JourneyDraftStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    pinned: boolean,
    updatedAt: number,
    locale: string,
    status: JourneyDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.pinned = pinned;
    this.updatedAt = updatedAt;
    this.locale = locale;
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

  canMoveTo(next: JourneyDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
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

  moveTo(next: JourneyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`journey draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"journey draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.updatedAt;
  }

  copy(): JourneyDraft {
    return new JourneyDraft(this.code, this.label, this.channel, this.pinned, this.updatedAt, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a journey draft in status open. */
export function newJourneyDraft(code: string, label: string): JourneyDraft {
  return new JourneyDraft(code, label, "", false, 0, "", "open");
}
