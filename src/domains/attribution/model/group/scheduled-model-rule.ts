import * as text from "../../../../kit/text.js";

/** Where a scheduled model rule is in its life cycle. */
export type ScheduledModelRuleStatus = "new" | "queued" | "running" | "done" | "failed";

/** A scheduled model rule. Its code is unique within a tenant. */
export class ScheduledModelRule {
  code: string;
  title: string;
  bid: number;
  clicks: number;
  locale: string;
  priority: number;
  variant: string;
  updatedAt: number;
  retries: number;
  notes: string;
  status: ScheduledModelRuleStatus;

  constructor(
    code: string,
    title: string,
    bid: number,
    clicks: number,
    locale: string,
    priority: number,
    variant: string,
    updatedAt: number,
    retries: number,
    notes: string,
    status: ScheduledModelRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.bid = bid;
    this.clicks = clicks;
    this.locale = locale;
    this.priority = priority;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.notes = notes;
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

  canMoveTo(next: ScheduledModelRuleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "running":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
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

  moveTo(next: ScheduledModelRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled model rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"scheduled model rule"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round((this.clicks - this.retries) * 100) / 100;
  }

  copy(): ScheduledModelRule {
    return new ScheduledModelRule(
      this.code,
      this.title,
      this.bid,
      this.clicks,
      this.locale,
      this.priority,
      this.variant,
      this.updatedAt,
      this.retries,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a scheduled model rule in status new. */
export function newScheduledModelRule(code: string, title: string): ScheduledModelRule {
  return new ScheduledModelRule(code, title, 0, 0, "", 0, "", 0, 0, "", "new");
}
