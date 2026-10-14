/**
 * The default path draft records of attribution's path work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default path draft is in its life cycle. */
export type DefaultPathDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A default path draft. Its code is unique within a tenant. */
export class DefaultPathDraft {
  code: string;
  name: string;
  locale: string;
  attempts: number;
  channel: string;
  rate: number;
  archived: boolean;
  windowDays: number;
  status: DefaultPathDraftStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    attempts: number,
    channel: string,
    rate: number,
    archived: boolean,
    windowDays: number,
    status: DefaultPathDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.attempts = attempts;
    this.channel = channel;
    this.rate = rate;
    this.archived = archived;
    this.windowDays = windowDays;
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

  canMoveTo(next: DefaultPathDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "reopened";
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

  moveTo(next: DefaultPathDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default path draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedExposure(): number {
    return Math.round((this.rate - this.attempts) * 100) / 100;
  }

  copy(): DefaultPathDraft {
    return new DefaultPathDraft(
      this.code,
      this.name,
      this.locale,
      this.attempts,
      this.channel,
      this.rate,
      this.archived,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default path draft in status open. */
export function newDefaultPathDraft(code: string, name: string): DefaultPathDraft {
  return new DefaultPathDraft(code, name, "", 0, "", 0, false, 0, "open");
}
