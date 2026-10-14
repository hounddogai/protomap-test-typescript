/**
 * The strict bid rule agreement records of adops's bid rule work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a strict bid rule agreement is in its life cycle. */
export type StrictBidRuleAgreementStatus = "new" | "queued" | "running" | "done" | "failed";

/** One strict bid rule agreement, with what the planners need to act on it. */
export class StrictBidRuleAgreement {
  code: string;
  label: string;
  timezone: string;
  frequencyCap: number;
  batchSize: number;
  title: string;
  sendAt: number;
  source: string;
  summary: string;
  weight: number;
  status: StrictBidRuleAgreementStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    frequencyCap: number,
    batchSize: number,
    title: string,
    sendAt: number,
    source: string,
    summary: string,
    weight: number,
    status: StrictBidRuleAgreementStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.frequencyCap = frequencyCap;
    this.batchSize = batchSize;
    this.title = title;
    this.sendAt = sendAt;
    this.source = source;
    this.summary = summary;
    this.weight = weight;
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

  canMoveTo(next: StrictBidRuleAgreementStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "running" || next === "done";
      case "queued":
        return next === "running" || next === "done";
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: StrictBidRuleAgreementStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bid rule agreement ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"strict bid rule agreement"} ${this.code}`;
  }

  netTotal(): number {
    return Math.round((this.weight - this.batchSize) * 100) / 100;
  }

  copy(): StrictBidRuleAgreement {
    return new StrictBidRuleAgreement(
      this.code,
      this.label,
      this.timezone,
      this.frequencyCap,
      this.batchSize,
      this.title,
      this.sendAt,
      this.source,
      this.summary,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a strict bid rule agreement in status new. */
export function newStrictBidRuleAgreement(code: string, label: string): StrictBidRuleAgreement {
  return new StrictBidRuleAgreement(code, label, "", 0, 0, "", 0, "", "", 0, "new");
}
