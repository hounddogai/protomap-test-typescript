/**
 * The exit rule review records of journeys's exit rule work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a exit rule review is in its life cycle. */
export type ExitRuleReviewStatus = "new" | "queued" | "running" | "done" | "failed";

/** A exit rule review. Its code is unique within a tenant. */
export class ExitRuleReview {
  code: string;
  label: string;
  capacity: number;
  durationMinutes: number;
  margin: number;
  externalRef: string;
  segment: string;
  tags: string[];
  status: ExitRuleReviewStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    durationMinutes: number,
    margin: number,
    externalRef: string,
    segment: string,
    tags: string[],
    status: ExitRuleReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.durationMinutes = durationMinutes;
    this.margin = margin;
    this.externalRef = externalRef;
    this.segment = segment;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleReviewStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued";
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ExitRuleReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  weightedVolume(): number {
    return Math.round(this.capacity * this.durationMinutes * 100) / 100;
  }

  copy(): ExitRuleReview {
    return new ExitRuleReview(
      this.code,
      this.label,
      this.capacity,
      this.durationMinutes,
      this.margin,
      this.externalRef,
      this.segment,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a exit rule review in status new. */
export function newExitRuleReview(code: string, label: string): ExitRuleReview {
  return new ExitRuleReview(code, label, 0, 0, 0, "", "", [], "new");
}
