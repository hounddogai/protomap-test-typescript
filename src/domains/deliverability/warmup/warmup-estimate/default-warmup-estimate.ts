/**
 * The default warmup estimate records of deliverability's warmup work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default warmup estimate is in its life cycle. */
export type DefaultWarmupEstimateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a default warmup estimate and its current status. */
export class DefaultWarmupEstimate {
  code: string;
  title: string;
  impressions: number;
  name: string;
  notes: string;
  utmSource: string;
  journeyId: string;
  bid: number;
  reviewer: string;
  status: DefaultWarmupEstimateStatus;

  constructor(
    code: string,
    title: string,
    impressions: number,
    name: string,
    notes: string,
    utmSource: string,
    journeyId: string,
    bid: number,
    reviewer: string,
    status: DefaultWarmupEstimateStatus,
  ) {
    this.code = code;
    this.title = title;
    this.impressions = impressions;
    this.name = name;
    this.notes = notes;
    this.utmSource = utmSource;
    this.journeyId = journeyId;
    this.bid = bid;
    this.reviewer = reviewer;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultWarmupEstimateStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: DefaultWarmupEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default warmup estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  weightedTotal(): number {
    return Math.round(this.impressions * this.bid * 100) / 100;
  }

  copy(): DefaultWarmupEstimate {
    return new DefaultWarmupEstimate(
      this.code,
      this.title,
      this.impressions,
      this.name,
      this.notes,
      this.utmSource,
      this.journeyId,
      this.bid,
      this.reviewer,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a default warmup estimate in status planned. */
export function newDefaultWarmupEstimate(code: string, title: string): DefaultWarmupEstimate {
  return new DefaultWarmupEstimate(code, title, 0, "", "", "", "", 0, "", "planned");
}
