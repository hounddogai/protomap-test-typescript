/**
 * The regional reply draft records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a regional reply draft is in its life cycle. */
export type RegionalReplyDraftStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One regional reply draft, with what the planners need to act on it. */
export class RegionalReplyDraft {
  code: string;
  label: string;
  country: string;
  quantity: number;
  batchSize: number;
  margin: number;
  minimum: number;
  status: RegionalReplyDraftStatus;

  constructor(
    code: string,
    label: string,
    country: string,
    quantity: number,
    batchSize: number,
    margin: number,
    minimum: number,
    status: RegionalReplyDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.country = country;
    this.quantity = quantity;
    this.batchSize = batchSize;
    this.margin = margin;
    this.minimum = minimum;
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

  canMoveTo(next: RegionalReplyDraftStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "resolved" || next === "reopened";
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalReplyDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional reply draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveLoad(): number {
    return Math.round(this.batchSize * this.quantity * 100) / 100;
  }

  copy(): RegionalReplyDraft {
    return new RegionalReplyDraft(
      this.code,
      this.label,
      this.country,
      this.quantity,
      this.batchSize,
      this.margin,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a regional reply draft in status open. */
export function newRegionalReplyDraft(code: string, label: string): RegionalReplyDraft {
  return new RegionalReplyDraft(code, label, "", 0, 0, 0, 0, "open");
}
