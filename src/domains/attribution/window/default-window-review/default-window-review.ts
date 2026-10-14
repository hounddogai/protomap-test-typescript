/**
 * The default window review records of attribution's window work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default window review is in its life cycle. */
export type DefaultWindowReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a default window review and its current status. */
export class DefaultWindowReview {
  code: string;
  title: string;
  locale: string;
  audienceId: string;
  ceiling: number;
  startsAt: number;
  discount: number;
  clicks: number;
  category: string;
  checksum: string;
  status: DefaultWindowReviewStatus;

  constructor(
    code: string,
    title: string,
    locale: string,
    audienceId: string,
    ceiling: number,
    startsAt: number,
    discount: number,
    clicks: number,
    category: string,
    checksum: string,
    status: DefaultWindowReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.locale = locale;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
    this.startsAt = startsAt;
    this.discount = discount;
    this.clicks = clicks;
    this.category = category;
    this.checksum = checksum;
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

  canMoveTo(next: DefaultWindowReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultWindowReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default window review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"default window review"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round((this.ceiling + this.discount) * 100) / 100;
  }

  copy(): DefaultWindowReview {
    return new DefaultWindowReview(
      this.code,
      this.title,
      this.locale,
      this.audienceId,
      this.ceiling,
      this.startsAt,
      this.discount,
      this.clicks,
      this.category,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a default window review in status idle. */
export function newDefaultWindowReview(code: string, title: string): DefaultWindowReview {
  return new DefaultWindowReview(code, title, "", "", 0, 0, 0, 0, "", "", "idle");
}
