import * as text from "../../../../kit/text.js";

/** Where a primary sender rule is in its life cycle. */
export type PrimarySenderRuleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One primary sender rule, with what the planners need to act on it. */
export class PrimarySenderRule {
  code: string;
  title: string;
  ceiling: number;
  country: string;
  clicks: number;
  phone: string;
  revision: number;
  graceDays: number;
  status: PrimarySenderRuleStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    country: string,
    clicks: number,
    phone: string,
    revision: number,
    graceDays: number,
    status: PrimarySenderRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.country = country;
    this.clicks = clicks;
    this.phone = phone;
    this.revision = revision;
    this.graceDays = graceDays;
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

  canMoveTo(next: PrimarySenderRuleStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "archived";
      case "in_review":
        return next === "resolved";
      case "resolved":
        switch (next) {
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

  moveTo(next: PrimarySenderRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary sender rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round((this.clicks - this.graceDays) * 100) / 100;
  }

  copy(): PrimarySenderRule {
    return new PrimarySenderRule(
      this.code,
      this.title,
      this.ceiling,
      this.country,
      this.clicks,
      this.phone,
      this.revision,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a primary sender rule in status open. */
export function newPrimarySenderRule(code: string, title: string): PrimarySenderRule {
  return new PrimarySenderRule(code, title, 0, "", 0, "", 0, 0, "open");
}
