/**
 * The reply plan records of social's reply work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reply plan is in its life cycle. */
export type ReplyPlanStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a reply plan and its current status. */
export class ReplyPlan {
  code: string;
  title: string;
  category: string;
  label: string;
  utmSource: string;
  notes: string;
  source: string;
  attributes: Map<string, string>;
  graceDays: number;
  status: ReplyPlanStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    label: string,
    utmSource: string,
    notes: string,
    source: string,
    attributes: Map<string, string>,
    graceDays: number,
    status: ReplyPlanStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.label = label;
    this.utmSource = utmSource;
    this.notes = notes;
    this.source = source;
    this.attributes = attributes;
    this.graceDays = graceDays;
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

  canMoveTo(next: ReplyPlanStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: ReplyPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reply plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"reply plan"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): ReplyPlan {
    return new ReplyPlan(
      this.code,
      this.title,
      this.category,
      this.label,
      this.utmSource,
      this.notes,
      this.source,
      this.attributes,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a reply plan in status open. */
export function newReplyPlan(code: string, title: string): ReplyPlan {
  return new ReplyPlan(code, title, "", "", "", "", "", new Map<string, string>(), 0, "open");
}
