import * as text from "../../../../kit/text.js";

/** Where a tiered subscription metric is in its life cycle. */
export type TieredSubscriptionMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** A tiered subscription metric. Its code is unique within a tenant. */
export class TieredSubscriptionMetric {
  code: string;
  label: string;
  utmSource: string;
  openRate: number;
  externalRef: string;
  attributes: Map<string, string>;
  channel: string;
  locale: string;
  cost: number;
  status: TieredSubscriptionMetricStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    openRate: number,
    externalRef: string,
    attributes: Map<string, string>,
    channel: string,
    locale: string,
    cost: number,
    status: TieredSubscriptionMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.externalRef = externalRef;
    this.attributes = attributes;
    this.channel = channel;
    this.locale = locale;
    this.cost = cost;
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

  canMoveTo(next: TieredSubscriptionMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: TieredSubscriptionMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered subscription metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"tiered subscription metric"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round((this.openRate + this.cost) * 100) / 100;
  }

  copy(): TieredSubscriptionMetric {
    return new TieredSubscriptionMetric(
      this.code,
      this.label,
      this.utmSource,
      this.openRate,
      this.externalRef,
      this.attributes,
      this.channel,
      this.locale,
      this.cost,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered subscription metric in status requested. */
export function newTieredSubscriptionMetric(code: string, label: string): TieredSubscriptionMetric {
  return new TieredSubscriptionMetric(code, label, "", 0, "", new Map<string, string>(), "", "", 0, "requested");
}
