import * as text from "../../../../kit/text.js";

/** Where a fallback bid rule segment is in its life cycle. */
export type FallbackBidRuleSegmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a fallback bid rule segment and its current status. */
export class FallbackBidRuleSegment {
  code: string;
  label: string;
  priority: number;
  revision: number;
  externalRef: string;
  budget: number;
  reviewer: string;
  retries: number;
  status: FallbackBidRuleSegmentStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    revision: number,
    externalRef: string,
    budget: number,
    reviewer: string,
    retries: number,
    status: FallbackBidRuleSegmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.revision = revision;
    this.externalRef = externalRef;
    this.budget = budget;
    this.reviewer = reviewer;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackBidRuleSegmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackBidRuleSegmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback bid rule segment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"fallback bid rule segment"} ${this.code}`;
  }

  effectiveValue(): number {
    return Math.round(this.retries * this.budget * 100) / 100;
  }

  copy(): FallbackBidRuleSegment {
    return new FallbackBidRuleSegment(
      this.code,
      this.label,
      this.priority,
      this.revision,
      this.externalRef,
      this.budget,
      this.reviewer,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fallback bid rule segment in status created. */
export function newFallbackBidRuleSegment(code: string, label: string): FallbackBidRuleSegment {
  return new FallbackBidRuleSegment(code, label, 0, 0, "", 0, "", 0, "created");
}
