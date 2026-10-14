/**
 * The touchpoint review records of attribution's touchpoint work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a touchpoint review is in its life cycle. */
export type TouchpointReviewStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a touchpoint review and its current status. */
export class TouchpointReview {
  code: string;
  title: string;
  ceiling: number;
  createdAt: number;
  startsAt: number;
  attributes: Map<string, string>;
  campaignRef: string;
  bid: number;
  weight: number;
  status: TouchpointReviewStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    createdAt: number,
    startsAt: number,
    attributes: Map<string, string>,
    campaignRef: string,
    bid: number,
    weight: number,
    status: TouchpointReviewStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.createdAt = createdAt;
    this.startsAt = startsAt;
    this.attributes = attributes;
    this.campaignRef = campaignRef;
    this.bid = bid;
    this.weight = weight;
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

  canMoveTo(next: TouchpointReviewStatus): boolean {
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

  moveTo(next: TouchpointReviewStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`touchpoint review ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"touchpoint review"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.weight - this.bid) * 100) / 100;
  }

  copy(): TouchpointReview {
    return new TouchpointReview(
      this.code,
      this.title,
      this.ceiling,
      this.createdAt,
      this.startsAt,
      this.attributes,
      this.campaignRef,
      this.bid,
      this.weight,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a touchpoint review in status idle. */
export function newTouchpointReview(code: string, title: string): TouchpointReview {
  return new TouchpointReview(code, title, 0, 0, 0, new Map<string, string>(), "", 0, 0, "idle");
}
