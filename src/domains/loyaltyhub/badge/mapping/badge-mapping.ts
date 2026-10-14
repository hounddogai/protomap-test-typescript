/**
 * The badge mapping records of loyaltyhub's badge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a badge mapping is in its life cycle. */
export type BadgeMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One badge mapping, with what the planners need to act on it. */
export class BadgeMapping {
  code: string;
  label: string;
  frequencyCap: number;
  active: boolean;
  channel: string;
  retries: number;
  locale: string;
  threshold: number;
  status: BadgeMappingStatus;

  constructor(
    code: string,
    label: string,
    frequencyCap: number,
    active: boolean,
    channel: string,
    retries: number,
    locale: string,
    threshold: number,
    status: BadgeMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.frequencyCap = frequencyCap;
    this.active = active;
    this.channel = channel;
    this.retries = retries;
    this.locale = locale;
    this.threshold = threshold;
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

  canMoveTo(next: BadgeMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
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

  moveTo(next: BadgeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`badge mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"badge mapping"} ${this.code}`;
  }

  weightedTotal(): number {
    return Math.round(this.retries * this.frequencyCap * 100) / 100;
  }

  copy(): BadgeMapping {
    return new BadgeMapping(
      this.code,
      this.label,
      this.frequencyCap,
      this.active,
      this.channel,
      this.retries,
      this.locale,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a badge mapping in status open. */
export function newBadgeMapping(code: string, label: string): BadgeMapping {
  return new BadgeMapping(code, label, 0, false, "", 0, "", 0, "open");
}
