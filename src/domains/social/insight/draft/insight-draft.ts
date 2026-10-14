/**
 * The insight draft records of social's insight work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a insight draft is in its life cycle. */
export type InsightDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One insight draft, with what the planners need to act on it. */
export class InsightDraft {
  code: string;
  label: string;
  rate: number;
  visible: boolean;
  region: string;
  status: InsightDraftStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    visible: boolean,
    region: string,
    status: InsightDraftStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.visible = visible;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: InsightDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "withdrawn";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: InsightDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`insight draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.rate;
  }

  copy(): InsightDraft {
    return new InsightDraft(this.code, this.label, this.rate, this.visible, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a insight draft in status proposed. */
export function newInsightDraft(code: string, label: string): InsightDraft {
  return new InsightDraft(code, label, 0, false, "", "proposed");
}
