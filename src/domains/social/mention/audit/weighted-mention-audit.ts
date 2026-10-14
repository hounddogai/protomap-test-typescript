/**
 * The weighted mention audit records of social's mention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a weighted mention audit is in its life cycle. */
export type WeightedMentionAuditStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted mention audit. Its code is unique within a tenant. */
export class WeightedMentionAudit {
  code: string;
  label: string;
  journeyId: string;
  score: number;
  locale: string;
  status: WeightedMentionAuditStatus;

  constructor(
    code: string,
    label: string,
    journeyId: string,
    score: number,
    locale: string,
    status: WeightedMentionAuditStatus,
  ) {
    this.code = code;
    this.label = label;
    this.journeyId = journeyId;
    this.score = score;
    this.locale = locale;
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

  canMoveTo(next: WeightedMentionAuditStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: WeightedMentionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted mention audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): WeightedMentionAudit {
    return new WeightedMentionAudit(this.code, this.label, this.journeyId, this.score, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted mention audit in status proposed. */
export function newWeightedMentionAudit(code: string, label: string): WeightedMentionAudit {
  return new WeightedMentionAudit(code, label, "", 0, "", "proposed");
}
