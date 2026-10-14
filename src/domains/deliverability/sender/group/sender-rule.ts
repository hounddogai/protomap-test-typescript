import * as text from "../../../../kit/text.js";

/** Where a sender rule is in its life cycle. */
export type SenderRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A sender rule. Its code is unique within a tenant. */
export class SenderRule {
  code: string;
  title: string;
  windowDays: number;
  clicks: number;
  timezone: string;
  openRate: number;
  amount: number;
  unit: string;
  status: SenderRuleStatus;

  constructor(
    code: string,
    title: string,
    windowDays: number,
    clicks: number,
    timezone: string,
    openRate: number,
    amount: number,
    unit: string,
    status: SenderRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.windowDays = windowDays;
    this.clicks = clicks;
    this.timezone = timezone;
    this.openRate = openRate;
    this.amount = amount;
    this.unit = unit;
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

  canMoveTo(next: SenderRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SenderRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sender rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sender rule"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round((this.amount - this.clicks) * 100) / 100;
  }

  copy(): SenderRule {
    return new SenderRule(
      this.code,
      this.title,
      this.windowDays,
      this.clicks,
      this.timezone,
      this.openRate,
      this.amount,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a sender rule in status open. */
export function newSenderRule(code: string, title: string): SenderRule {
  return new SenderRule(code, title, 0, 0, "", 0, 0, "", "open");
}
