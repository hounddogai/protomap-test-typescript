/**
 * The fallback step audit records of journeys's step work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a fallback step audit is in its life cycle. */
export type FallbackStepAuditStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One fallback step audit, with what the planners need to act on it. */
export class FallbackStepAudit {
  code: string;
  title: string;
  locale: string;
  audienceId: string;
  version: number;
  amount: number;
  attempts: number;
  tags: string[];
  status: FallbackStepAuditStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    audienceId: string,
    version: number,
    amount: number,
    attempts: number,
    tags: string[],
    status: FallbackStepAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.audienceId = audienceId;
    this.version = version;
    this.amount = amount;
    this.attempts = attempts;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackStepAuditStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackStepAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback step audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.amount - this.version) * 100) / 100;
  }

  copy(): FallbackStepAudit {
    return new FallbackStepAudit(
      this.code,
      this.title,
      this.locale,
      this.audienceId,
      this.version,
      this.amount,
      this.attempts,
      this.tags,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback step audit in status draft. */
export function newFallbackStepAudit(code: string, title: string): FallbackStepAudit {
  return new FallbackStepAudit(code, title, "", "", 0, 0, 0, [], "draft");
}
