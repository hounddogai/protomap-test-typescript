/**
 * The post template records of social's post work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a post template is in its life cycle. */
export type PostTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One post template, with what the planners need to act on it. */
export class PostTemplate {
  code: string;
  name: string;
  pinned: boolean;
  summary: string;
  variant: string;
  score: number;
  expiresAt: number;
  timezone: string;
  cohort: string;
  status: PostTemplateStatus;

  constructor(
    code: string,
    name: string,
    pinned: boolean,
    summary: string,
    variant: string,
    score: number,
    expiresAt: number,
    timezone: string,
    cohort: string,
    status: PostTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.pinned = pinned;
    this.summary = summary;
    this.variant = variant;
    this.score = score;
    this.expiresAt = expiresAt;
    this.timezone = timezone;
    this.cohort = cohort;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round(this.expiresAt * this.score * 100) / 100;
  }

  copy(): PostTemplate {
    return new PostTemplate(
      this.code,
      this.name,
      this.pinned,
      this.summary,
      this.variant,
      this.score,
      this.expiresAt,
      this.timezone,
      this.cohort,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a post template in status planned. */
export function newPostTemplate(code: string, name: string): PostTemplate {
  return new PostTemplate(code, name, false, "", "", 0, 0, "", "", "planned");
}
