/**
 * The manual pacing review records of adops's pacing work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a manual pacing review is in its life cycle. */
export type ManualPacingReviewStatus = "requested" | "granted" | "revoked" | "expired";

/** A manual pacing review. Its code is unique within a tenant. */
export class ManualPacingReview {
  code: string;
  label: string;
  description: string;
  ratio: number;
  locale: string;
  status: ManualPacingReviewStatus;

  constructor(
    code: string,
    label: string,
    description: string,
    ratio: number,
    locale: string,
    status: ManualPacingReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.description = description;
    this.ratio = ratio;
    this.locale = locale;
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

  canMoveTo(next: ManualPacingReviewStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
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

  moveTo(next: ManualPacingReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`manual pacing review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.ratio;
  }

  copy(): ManualPacingReview {
    return new ManualPacingReview(this.code, this.label, this.description, this.ratio, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a manual pacing review in status requested. */
export function newManualPacingReview(code: string, label: string): ManualPacingReview {
  return new ManualPacingReview(code, label, "", 0, "", "requested");
}
