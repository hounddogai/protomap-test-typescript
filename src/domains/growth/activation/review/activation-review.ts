/**
 * The activation review records of growth's activation work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a activation review is in its life cycle. */
export type ActivationReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A activation review as the activation team keeps it. */
export class ActivationReview {
  code: string;
  title: string;
  category: string;
  budget: number;
  tags: string[];
  label: string;
  timezone: string;
  floorValue: number;
  limit: number;
  status: ActivationReviewStatus;

  constructor(
    code: string,
    title: string,
    category: string,
    budget: number,
    tags: string[],
    label: string,
    timezone: string,
    floorValue: number,
    limit: number,
    status: ActivationReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.category = category;
    this.budget = budget;
    this.tags = tags;
    this.label = label;
    this.timezone = timezone;
    this.floorValue = floorValue;
    this.limit = limit;
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

  canMoveTo(next: ActivationReviewStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ActivationReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.title})`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveExposure(): number {
    return Math.round((this.limit - this.budget) * 100) / 100;
  }

  copy(): ActivationReview {
    return new ActivationReview(
      this.code,
      this.title,
      this.category,
      this.budget,
      this.tags,
      this.label,
      this.timezone,
      this.floorValue,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a activation review in status idle. */
export function newActivationReview(code: string, title: string): ActivationReview {
  return new ActivationReview(code, title, "", 0, [], "", "", 0, 0, "idle");
}
