/**
 * The retention draft records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention draft is in its life cycle. */
export type RetentionDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A retention draft as the retention team keeps it. */
export class RetentionDraft {
  code: string;
  label: string;
  capacity: number;
  discount: number;
  archived: boolean;
  category: string;
  clicks: number;
  score: number;
  locale: string;
  priority: number;
  status: RetentionDraftStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    discount: number,
    archived: boolean,
    category: string,
    clicks: number,
    score: number,
    locale: string,
    priority: number,
    status: RetentionDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.discount = discount;
    this.archived = archived;
    this.category = category;
    this.clicks = clicks;
    this.score = score;
    this.locale = locale;
    this.priority = priority;
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

  canMoveTo(next: RetentionDraftStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.capacity - this.discount) * 100) / 100;
  }

  copy(): RetentionDraft {
    return new RetentionDraft(
      this.code,
      this.label,
      this.capacity,
      this.discount,
      this.archived,
      this.category,
      this.clicks,
      this.score,
      this.locale,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a retention draft in status open. */
export function newRetentionDraft(code: string, label: string): RetentionDraft {
  return new RetentionDraft(code, label, 0, 0, false, "", 0, 0, "", 0, "open");
}
