/**
 * The warmup estimate records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup estimate is in its life cycle. */
export type WarmupEstimateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a warmup estimate and its current status. */
export class WarmupEstimate {
  code: string;
  title: string;
  summary: string;
  utmSource: string;
  campaignRef: string;
  floorValue: number;
  discount: number;
  status: WarmupEstimateStatus;

  constructor(
    code: string,
    title: string,
    summary: string,
    utmSource: string,
    campaignRef: string,
    floorValue: number,
    discount: number,
    status: WarmupEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.summary = summary;
    this.utmSource = utmSource;
    this.campaignRef = campaignRef;
    this.floorValue = floorValue;
    this.discount = discount;
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

  canMoveTo(next: WarmupEstimateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: WarmupEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedTotal(): number {
    return Math.round((this.discount - this.floorValue) * 100) / 100;
  }

  copy(): WarmupEstimate {
    return new WarmupEstimate(
      this.code,
      this.title,
      this.summary,
      this.utmSource,
      this.campaignRef,
      this.floorValue,
      this.discount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a warmup estimate in status open. */
export function newWarmupEstimate(code: string, title: string): WarmupEstimate {
  return new WarmupEstimate(code, title, "", "", "", 0, 0, "open");
}
