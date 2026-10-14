/**
 * The post draft records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post draft is in its life cycle. */
export type PostDraftStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One post draft, with what the planners need to act on it. */
export class PostDraft {
  code: string;
  name: string;
  budget: number;
  notes: string;
  locale: string;
  margin: number;
  priority: number;
  campaignRef: string;
  status: PostDraftStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    notes: string,
    locale: string,
    margin: number,
    priority: number,
    campaignRef: string,
    status: PostDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.notes = notes;
    this.locale = locale;
    this.margin = margin;
    this.priority = priority;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PostDraftStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PostDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  effectiveExposure(): number {
    return Math.round((this.margin + this.priority) * 100) / 100;
  }

  copy(): PostDraft {
    return new PostDraft(
      this.code,
      this.name,
      this.budget,
      this.notes,
      this.locale,
      this.margin,
      this.priority,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a post draft in status draft. */
export function newPostDraft(code: string, name: string): PostDraft {
  return new PostDraft(code, name, 0, "", "", 0, 0, "", "draft");
}
