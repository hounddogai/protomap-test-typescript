/**
 * The capped double opt in bundle records of consentcenter's double opt in work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped double opt in bundle is in its life cycle. */
export type CappedDoubleOptInBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A capped double opt in bundle. Its code is unique within a tenant. */
export class CappedDoubleOptInBundle {
  code: string;
  title: string;
  externalRef: string;
  endsAt: number;
  ratio: number;
  variant: string;
  reviewer: string;
  maximum: number;
  approved: boolean;
  status: CappedDoubleOptInBundleStatus;

  constructor(
    code: string,
    title: string,
    externalRef: string,
    endsAt: number,
    ratio: number,
    variant: string,
    reviewer: string,
    maximum: number,
    approved: boolean,
    status: CappedDoubleOptInBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.externalRef = externalRef;
    this.endsAt = endsAt;
    this.ratio = ratio;
    this.variant = variant;
    this.reviewer = reviewer;
    this.maximum = maximum;
    this.approved = approved;
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

  canMoveTo(next: CappedDoubleOptInBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedDoubleOptInBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped double opt in bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  effectiveVolume(): number {
    return Math.round(this.ratio * this.endsAt * 100) / 100;
  }

  copy(): CappedDoubleOptInBundle {
    return new CappedDoubleOptInBundle(
      this.code,
      this.title,
      this.externalRef,
      this.endsAt,
      this.ratio,
      this.variant,
      this.reviewer,
      this.maximum,
      this.approved,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a capped double opt in bundle in status open. */
export function newCappedDoubleOptInBundle(code: string, title: string): CappedDoubleOptInBundle {
  return new CappedDoubleOptInBundle(code, title, "", 0, 0, "", "", 0, false, "open");
}
