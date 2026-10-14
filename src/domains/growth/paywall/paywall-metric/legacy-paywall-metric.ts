/**
 * The legacy paywall metric records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a legacy paywall metric is in its life cycle. */
export type LegacyPaywallMetricStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy paywall metric. Its code is unique within a tenant. */
export class LegacyPaywallMetric {
  code: string;
  title: string;
  audienceId: string;
  updatedAt: number;
  attributes: Map<string, string>;
  clicks: number;
  openRate: number;
  limit: number;
  version: number;
  status: LegacyPaywallMetricStatus;

  constructor(
    code: string,
    title: string,
    audienceId: string,
    updatedAt: number,
    attributes: Map<string, string>,
    clicks: number,
    openRate: number,
    limit: number,
    version: number,
    status: LegacyPaywallMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.audienceId = audienceId;
    this.updatedAt = updatedAt;
    this.attributes = attributes;
    this.clicks = clicks;
    this.openRate = openRate;
    this.limit = limit;
    this.version = version;
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

  canMoveTo(next: LegacyPaywallMetricStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "ready";
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: LegacyPaywallMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy paywall metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${"legacy paywall metric"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round(this.openRate * this.limit * 100) / 100;
  }

  copy(): LegacyPaywallMetric {
    return new LegacyPaywallMetric(
      this.code,
      this.title,
      this.audienceId,
      this.updatedAt,
      this.attributes,
      this.clicks,
      this.openRate,
      this.limit,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy paywall metric in status idle. */
export function newLegacyPaywallMetric(code: string, title: string): LegacyPaywallMetric {
  return new LegacyPaywallMetric(code, title, "", 0, new Map<string, string>(), 0, 0, 0, 0, "idle");
}
