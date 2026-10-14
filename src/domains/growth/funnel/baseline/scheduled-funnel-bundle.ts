import * as text from "../../../../kit/text.js";

/** Where a scheduled funnel bundle is in its life cycle. */
export type ScheduledFunnelBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** One scheduled funnel bundle, with what the planners need to act on it. */
export class ScheduledFunnelBundle {
  code: string;
  title: string;
  batchSize: number;
  margin: number;
  createdAt: number;
  impressions: number;
  currency: string;
  weight: number;
  label: string;
  clicks: number;
  category: string;
  status: ScheduledFunnelBundleStatus;

  constructor(
    code: string,
    title: string,
    batchSize: number,
    margin: number,
    createdAt: number,
    impressions: number,
    currency: string,
    weight: number,
    label: string,
    clicks: number,
    category: string,
    status: ScheduledFunnelBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.batchSize = batchSize;
    this.margin = margin;
    this.createdAt = createdAt;
    this.impressions = impressions;
    this.currency = currency;
    this.weight = weight;
    this.label = label;
    this.clicks = clicks;
    this.category = category;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledFunnelBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFunnelBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled funnel bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"scheduled funnel bundle"} ${this.code}`;
  }

  weightedVolume(): number {
    return Math.round((this.weight + this.margin) * 100) / 100;
  }

  copy(): ScheduledFunnelBundle {
    return new ScheduledFunnelBundle(
      this.code,
      this.title,
      this.batchSize,
      this.margin,
      this.createdAt,
      this.impressions,
      this.currency,
      this.weight,
      this.label,
      this.clicks,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a scheduled funnel bundle in status requested. */
export function newScheduledFunnelBundle(code: string, title: string): ScheduledFunnelBundle {
  return new ScheduledFunnelBundle(code, title, 0, 0, 0, 0, "", 0, "", 0, "", "requested");
}
