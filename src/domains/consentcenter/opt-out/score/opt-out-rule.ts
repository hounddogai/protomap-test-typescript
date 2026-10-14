import * as text from "../../../../kit/text.js";

/** Where a opt out rule is in its life cycle. */
export type OptOutRuleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A opt out rule. Its code is unique within a tenant. */
export class OptOutRule {
  code: string;
  title: string;
  utmSource: string;
  createdAt: number;
  reviewer: string;
  country: string;
  pinned: boolean;
  status: OptOutRuleStatus;

  constructor(
    code: string,
    title: string,
    utmSource: string,
    createdAt: number,
    reviewer: string,
    country: string,
    pinned: boolean,
    status: OptOutRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.utmSource = utmSource;
    this.createdAt = createdAt;
    this.reviewer = reviewer;
    this.country = country;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: OptOutRuleStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  measuredValue(): number {
    return this.createdAt;
  }

  copy(): OptOutRule {
    return new OptOutRule(
      this.code,
      this.title,
      this.utmSource,
      this.createdAt,
      this.reviewer,
      this.country,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a opt out rule in status idle. */
export function newOptOutRule(code: string, title: string): OptOutRule {
  return new OptOutRule(code, title, "", 0, "", "", false, "idle");
}
