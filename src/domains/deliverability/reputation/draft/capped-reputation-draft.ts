/**
 * The capped reputation draft records of deliverability's reputation work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped reputation draft is in its life cycle. */
export type CappedReputationDraftStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A capped reputation draft. Its code is unique within a tenant. */
export class CappedReputationDraft {
  code: string;
  title: string;
  updatedAt: number;
  name: string;
  budget: number;
  reviewer: string;
  utmSource: string;
  audienceId: string;
  windowDays: number;
  checksum: string;
  status: CappedReputationDraftStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    name: string,
    budget: number,
    reviewer: string,
    utmSource: string,
    audienceId: string,
    windowDays: number,
    checksum: string,
    status: CappedReputationDraftStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.name = name;
    this.budget = budget;
    this.reviewer = reviewer;
    this.utmSource = utmSource;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.checksum = checksum;
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

  canMoveTo(next: CappedReputationDraftStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "rejected":
            return true;
        }
        return false;
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

  moveTo(next: CappedReputationDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped reputation draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.updatedAt + this.budget) * 100) / 100;
  }

  copy(): CappedReputationDraft {
    return new CappedReputationDraft(
      this.code,
      this.title,
      this.updatedAt,
      this.name,
      this.budget,
      this.reviewer,
      this.utmSource,
      this.audienceId,
      this.windowDays,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a capped reputation draft in status proposed. */
export function newCappedReputationDraft(code: string, title: string): CappedReputationDraft {
  return new CappedReputationDraft(code, title, 0, "", 0, "", "", "", 0, "", "proposed");
}
