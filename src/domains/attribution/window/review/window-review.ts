/**
 * The window review records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window review is in its life cycle. */
export type WindowReviewStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A window review. Its code is unique within a tenant. */
export class WindowReview {
  code: string;
  name: string;
  checksum: string;
  locale: string;
  discount: number;
  version: number;
  status: WindowReviewStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    locale: string,
    discount: number,
    version: number,
    status: WindowReviewStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.locale = locale;
    this.discount = discount;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowReviewStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: WindowReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.discount - this.version) * 100) / 100;
  }

  copy(): WindowReview {
    return new WindowReview(this.code, this.name, this.checksum, this.locale, this.discount, this.version, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window review in status draft. */
export function newWindowReview(code: string, name: string): WindowReview {
  return new WindowReview(code, name, "", "", 0, 0, "draft");
}
