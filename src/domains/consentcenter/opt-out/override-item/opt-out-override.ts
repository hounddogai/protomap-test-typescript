/**
 * The opt out override records of consentcenter's opt out work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a opt out override is in its life cycle. */
export type OptOutOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A opt out override as the opt out team keeps it. */
export class OptOutOverride {
  code: string;
  title: string;
  visible: boolean;
  summary: string;
  variant: string;
  locale: string;
  amount: number;
  status: OptOutOverrideStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    summary: string,
    variant: string,
    locale: string,
    amount: number,
    status: OptOutOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.summary = summary;
    this.variant = variant;
    this.locale = locale;
    this.amount = amount;
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

  canMoveTo(next: OptOutOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: OptOutOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`opt out override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"opt out override"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): OptOutOverride {
    return new OptOutOverride(
      this.code,
      this.title,
      this.visible,
      this.summary,
      this.variant,
      this.locale,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a opt out override in status requested. */
export function newOptOutOverride(code: string, title: string): OptOutOverride {
  return new OptOutOverride(code, title, false, "", "", "", 0, "requested");
}
