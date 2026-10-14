/**
 * The retention batch records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention batch is in its life cycle. */
export type RetentionBatchStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One retention batch, with what the planners need to act on it. */
export class RetentionBatch {
  code: string;
  label: string;
  limit: number;
  tags: string[];
  visible: boolean;
  approved: boolean;
  journeyId: string;
  amount: number;
  windowDays: number;
  contactEmail: string;
  status: RetentionBatchStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    tags: string[],
    visible: boolean,
    approved: boolean,
    journeyId: string,
    amount: number,
    windowDays: number,
    contactEmail: string,
    status: RetentionBatchStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.tags = tags;
    this.visible = visible;
    this.approved = approved;
    this.journeyId = journeyId;
    this.amount = amount;
    this.windowDays = windowDays;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: RetentionBatchStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RetentionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedTotal(): number {
    return Math.round(this.limit * this.amount * 100) / 100;
  }

  copy(): RetentionBatch {
    return new RetentionBatch(
      this.code,
      this.label,
      this.limit,
      this.tags,
      this.visible,
      this.approved,
      this.journeyId,
      this.amount,
      this.windowDays,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a retention batch in status proposed. */
export function newRetentionBatch(code: string, label: string): RetentionBatch {
  return new RetentionBatch(code, label, 0, [], false, false, "", 0, 0, "", "proposed");
}
