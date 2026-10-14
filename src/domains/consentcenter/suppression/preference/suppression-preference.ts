/**
 * The suppression preference records of consentcenter's suppression work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a suppression preference is in its life cycle. */
export type SuppressionPreferenceStatus = "requested" | "granted" | "revoked" | "expired";

/** A suppression preference. Its code is unique within a tenant. */
export class SuppressionPreference {
  code: string;
  title: string;
  locale: string;
  summary: string;
  cohort: string;
  ratio: number;
  campaignRef: string;
  attempts: number;
  status: SuppressionPreferenceStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    summary: string,
    cohort: string,
    ratio: number,
    campaignRef: string,
    attempts: number,
    status: SuppressionPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.summary = summary;
    this.cohort = cohort;
    this.ratio = ratio;
    this.campaignRef = campaignRef;
    this.attempts = attempts;
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

  canMoveTo(next: SuppressionPreferenceStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SuppressionPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`suppression preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"suppression preference"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.attempts - this.ratio) * 100) / 100;
  }

  copy(): SuppressionPreference {
    return new SuppressionPreference(
      this.code,
      this.title,
      this.locale,
      this.summary,
      this.cohort,
      this.ratio,
      this.campaignRef,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a suppression preference in status requested. */
export function newSuppressionPreference(code: string, title: string): SuppressionPreference {
  return new SuppressionPreference(code, title, "", "", "", 0, "", 0, "requested");
}
