/**
 * The retention adjustment records of growth's retention work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a retention adjustment is in its life cycle. */
export type RetentionAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** The record of a retention adjustment and its current status. */
export class RetentionAdjustment {
  code: string;
  title: string;
  campaignRef: string;
  startsAt: number;
  sequence: number;
  openRate: number;
  summary: string;
  updatedAt: number;
  threshold: number;
  retries: number;
  status: RetentionAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    startsAt: number,
    sequence: number,
    openRate: number,
    summary: string,
    updatedAt: number,
    threshold: number,
    retries: number,
    status: RetentionAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.startsAt = startsAt;
    this.sequence = sequence;
    this.openRate = openRate;
    this.summary = summary;
    this.updatedAt = updatedAt;
    this.threshold = threshold;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: RetentionAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: RetentionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`retention adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"retention adjustment"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round(this.openRate * this.threshold * 100) / 100;
  }

  copy(): RetentionAdjustment {
    return new RetentionAdjustment(
      this.code,
      this.title,
      this.campaignRef,
      this.startsAt,
      this.sequence,
      this.openRate,
      this.summary,
      this.updatedAt,
      this.threshold,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a retention adjustment in status created. */
export function newRetentionAdjustment(code: string, title: string): RetentionAdjustment {
  return new RetentionAdjustment(code, title, "", 0, 0, 0, "", 0, 0, 0, "created");
}
