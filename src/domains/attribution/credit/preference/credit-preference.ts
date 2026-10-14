/**
 * The credit preference records of attribution's credit work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a credit preference is in its life cycle. */
export type CreditPreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A credit preference. Its code is unique within a tenant. */
export class CreditPreference {
  code: string;
  title: string;
  source: string;
  name: string;
  endsAt: number;
  priority: number;
  utmSource: string;
  status: CreditPreferenceStatus;

  constructor(
    code: string,
    title: string,
    source: string,
    name: string,
    endsAt: number,
    priority: number,
    utmSource: string,
    status: CreditPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.source = source;
    this.name = name;
    this.endsAt = endsAt;
    this.priority = priority;
    this.utmSource = utmSource;
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

  canMoveTo(next: CreditPreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review" || next === "archived";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: CreditPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`credit preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"credit preference"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.priority * this.endsAt * 100) / 100;
  }

  copy(): CreditPreference {
    return new CreditPreference(
      this.code,
      this.title,
      this.source,
      this.name,
      this.endsAt,
      this.priority,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a credit preference in status open. */
export function newCreditPreference(code: string, title: string): CreditPreference {
  return new CreditPreference(code, title, "", "", 0, 0, "", "open");
}
