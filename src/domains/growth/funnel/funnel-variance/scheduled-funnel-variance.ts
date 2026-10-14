/**
 * The scheduled funnel variance records of growth's funnel work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled funnel variance is in its life cycle. */
export type ScheduledFunnelVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A scheduled funnel variance. Its code is unique within a tenant. */
export class ScheduledFunnelVariance {
  code: string;
  name: string;
  createdAt: number;
  visible: boolean;
  campaignRef: string;
  category: string;
  channel: string;
  retries: number;
  ratio: number;
  utmSource: string;
  status: ScheduledFunnelVarianceStatus;

  constructor(
    code: string,
    name: string,
    createdAt: number,
    visible: boolean,
    campaignRef: string,
    category: string,
    channel: string,
    retries: number,
    ratio: number,
    utmSource: string,
    status: ScheduledFunnelVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.createdAt = createdAt;
    this.visible = visible;
    this.campaignRef = campaignRef;
    this.category = category;
    this.channel = channel;
    this.retries = retries;
    this.ratio = ratio;
    this.utmSource = utmSource;
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

  canMoveTo(next: ScheduledFunnelVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
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

  moveTo(next: ScheduledFunnelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled funnel variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedVolume(): number {
    return Math.round(this.ratio * this.createdAt * 100) / 100;
  }

  copy(): ScheduledFunnelVariance {
    return new ScheduledFunnelVariance(
      this.code,
      this.name,
      this.createdAt,
      this.visible,
      this.campaignRef,
      this.category,
      this.channel,
      this.retries,
      this.ratio,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled funnel variance in status idle. */
export function newScheduledFunnelVariance(code: string, name: string): ScheduledFunnelVariance {
  return new ScheduledFunnelVariance(code, name, 0, false, "", "", "", 0, 0, "", "idle");
}
