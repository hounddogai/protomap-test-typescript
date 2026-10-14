import * as text from "../../../../kit/text.js";

/** Where a pending exit rule record is in its life cycle. */
export type PendingExitRuleRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** One pending exit rule record, with what the planners need to act on it. */
export class PendingExitRuleRecord {
  code: string;
  name: string;
  attempts: number;
  locale: string;
  tags: string[];
  label: string;
  threshold: number;
  budget: number;
  timezone: string;
  createdAt: number;
  status: PendingExitRuleRecordStatus;

  constructor(
    code: string,
    name: string,
    attempts: number,
    locale: string,
    tags: string[],
    label: string,
    threshold: number,
    budget: number,
    timezone: string,
    createdAt: number,
    status: PendingExitRuleRecordStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attempts = attempts;
    this.locale = locale;
    this.tags = tags;
    this.label = label;
    this.threshold = threshold;
    this.budget = budget;
    this.timezone = timezone;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingExitRuleRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PendingExitRuleRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending exit rule record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pending exit rule record"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedTotal(): number {
    return Math.round((this.budget + this.attempts) * 100) / 100;
  }

  copy(): PendingExitRuleRecord {
    return new PendingExitRuleRecord(
      this.code,
      this.name,
      this.attempts,
      this.locale,
      this.tags,
      this.label,
      this.threshold,
      this.budget,
      this.timezone,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending exit rule record in status requested. */
export function newPendingExitRuleRecord(code: string, name: string): PendingExitRuleRecord {
  return new PendingExitRuleRecord(code, name, 0, "", [], "", 0, 0, "", 0, "requested");
}
