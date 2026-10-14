/**
 * The conversion review records of attribution's conversion work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a conversion review is in its life cycle. */
export type ConversionReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One conversion review, with what the planners need to act on it. */
export class ConversionReview {
  code: string;
  label: string;
  locale: string;
  limit: number;
  openRate: number;
  ceiling: number;
  attributes: Map<string, string>;
  journeyId: string;
  status: ConversionReviewStatus;

  constructor(
    code: string,
    label: string,
    locale: string,
    limit: number,
    openRate: number,
    ceiling: number,
    attributes: Map<string, string>,
    journeyId: string,
    status: ConversionReviewStatus,
  ) {
    this.code = code;
    this.label = label;
    this.locale = locale;
    this.limit = limit;
    this.openRate = openRate;
    this.ceiling = ceiling;
    this.attributes = attributes;
    this.journeyId = journeyId;
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

  canMoveTo(next: ConversionReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ConversionReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`conversion review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.limit + this.ceiling) * 100) / 100;
  }

  copy(): ConversionReview {
    return new ConversionReview(
      this.code,
      this.label,
      this.locale,
      this.limit,
      this.openRate,
      this.ceiling,
      this.attributes,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a conversion review in status idle. */
export function newConversionReview(code: string, label: string): ConversionReview {
  return new ConversionReview(code, label, "", 0, 0, 0, new Map<string, string>(), "", "idle");
}
