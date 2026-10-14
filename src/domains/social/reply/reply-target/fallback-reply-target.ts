/**
 * The fallback reply target records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback reply target is in its life cycle. */
export type FallbackReplyTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback reply target. Its code is unique within a tenant. */
export class FallbackReplyTarget {
  code: string;
  title: string;
  phone: string;
  visible: boolean;
  cohort: string;
  summary: string;
  score: number;
  status: FallbackReplyTargetStatus;

  constructor(
    code: string,
    title: string,
    phone: string,
    visible: boolean,
    cohort: string,
    summary: string,
    score: number,
    status: FallbackReplyTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.phone = phone;
    this.visible = visible;
    this.cohort = cohort;
    this.summary = summary;
    this.score = score;
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

  canMoveTo(next: FallbackReplyTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "in_progress":
        return next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FallbackReplyTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reply target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback reply target"} ${this.code}`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): FallbackReplyTarget {
    return new FallbackReplyTarget(
      this.code,
      this.title,
      this.phone,
      this.visible,
      this.cohort,
      this.summary,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback reply target in status planned. */
export function newFallbackReplyTarget(code: string, title: string): FallbackReplyTarget {
  return new FallbackReplyTarget(code, title, "", false, "", "", 0, "planned");
}
