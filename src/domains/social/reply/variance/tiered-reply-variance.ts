/**
 * The tiered reply variance records of social's reply work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered reply variance is in its life cycle. */
export type TieredReplyVarianceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a tiered reply variance and its current status. */
export class TieredReplyVariance {
  code: string;
  title: string;
  ownerId: string;
  reviewer: string;
  summary: string;
  graceDays: number;
  ratio: number;
  country: string;
  status: TieredReplyVarianceStatus;

  constructor(
    code: string,
    title: string,
    ownerId: string,
    reviewer: string,
    summary: string,
    graceDays: number,
    ratio: number,
    country: string,
    status: TieredReplyVarianceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ownerId = ownerId;
    this.reviewer = reviewer;
    this.summary = summary;
    this.graceDays = graceDays;
    this.ratio = ratio;
    this.country = country;
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

  canMoveTo(next: TieredReplyVarianceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: TieredReplyVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered reply variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  projectedValue(): number {
    return Math.round(this.graceDays * this.ratio * 100) / 100;
  }

  copy(): TieredReplyVariance {
    return new TieredReplyVariance(
      this.code,
      this.title,
      this.ownerId,
      this.reviewer,
      this.summary,
      this.graceDays,
      this.ratio,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered reply variance in status draft. */
export function newTieredReplyVariance(code: string, title: string): TieredReplyVariance {
  return new TieredReplyVariance(code, title, "", "", "", 0, 0, "", "draft");
}
