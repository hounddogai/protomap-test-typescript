/**
 * The default credit override records of attribution's credit work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default credit override is in its life cycle. */
export type DefaultCreditOverrideStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a default credit override and its current status. */
export class DefaultCreditOverride {
  code: string;
  title: string;
  journeyId: string;
  createdAt: number;
  threshold: number;
  campaignRef: string;
  impressions: number;
  clicks: number;
  retries: number;
  source: string;
  margin: number;
  status: DefaultCreditOverrideStatus;

  constructor(
    code: string,
    title: string,
    journeyId: string,
    createdAt: number,
    threshold: number,
    campaignRef: string,
    impressions: number,
    clicks: number,
    retries: number,
    source: string,
    margin: number,
    status: DefaultCreditOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.journeyId = journeyId;
    this.createdAt = createdAt;
    this.threshold = threshold;
    this.campaignRef = campaignRef;
    this.impressions = impressions;
    this.clicks = clicks;
    this.retries = retries;
    this.source = source;
    this.margin = margin;
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

  canMoveTo(next: DefaultCreditOverrideStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultCreditOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default credit override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedExposure(): number {
    return Math.round(this.impressions * this.retries * 100) / 100;
  }

  copy(): DefaultCreditOverride {
    return new DefaultCreditOverride(
      this.code,
      this.title,
      this.journeyId,
      this.createdAt,
      this.threshold,
      this.campaignRef,
      this.impressions,
      this.clicks,
      this.retries,
      this.source,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a default credit override in status idle. */
export function newDefaultCreditOverride(code: string, title: string): DefaultCreditOverride {
  return new DefaultCreditOverride(code, title, "", 0, 0, "", 0, 0, 0, "", 0, "idle");
}
