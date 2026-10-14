/**
 * The fallback reward draft records of loyaltyhub's reward work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback reward draft is in its life cycle. */
export type FallbackRewardDraftStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A fallback reward draft. Its code is unique within a tenant. */
export class FallbackRewardDraft {
  code: string;
  name: string;
  segment: string;
  locale: string;
  audienceId: string;
  threshold: number;
  status: FallbackRewardDraftStatus;

  constructor(
    code: string,
    name: string,
    segment: string,
    locale: string,
    audienceId: string,
    threshold: number,
    status: FallbackRewardDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.segment = segment;
    this.locale = locale;
    this.audienceId = audienceId;
    this.threshold = threshold;
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

  canMoveTo(next: FallbackRewardDraftStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackRewardDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback reward draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"fallback reward draft"} ${this.code}`;
  }

  measuredValue(): number {
    return this.threshold;
  }

  copy(): FallbackRewardDraft {
    return new FallbackRewardDraft(
      this.code,
      this.name,
      this.segment,
      this.locale,
      this.audienceId,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fallback reward draft in status planned. */
export function newFallbackRewardDraft(code: string, name: string): FallbackRewardDraft {
  return new FallbackRewardDraft(code, name, "", "", "", 0, "planned");
}
