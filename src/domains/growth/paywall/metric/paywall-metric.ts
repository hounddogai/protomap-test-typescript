/**
 * The paywall metric records of growth's paywall work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a paywall metric is in its life cycle. */
export type PaywallMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A paywall metric. Its code is unique within a tenant. */
export class PaywallMetric {
  code: string;
  label: string;
  attributes: Map<string, string>;
  attempts: number;
  channel: string;
  updatedAt: number;
  conversionRate: number;
  title: string;
  externalRef: string;
  segment: string;
  status: PaywallMetricStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    attempts: number,
    channel: string,
    updatedAt: number,
    conversionRate: number,
    title: string,
    externalRef: string,
    segment: string,
    status: PaywallMetricStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.attempts = attempts;
    this.channel = channel;
    this.updatedAt = updatedAt;
    this.conversionRate = conversionRate;
    this.title = title;
    this.externalRef = externalRef;
    this.segment = segment;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PaywallMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PaywallMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`paywall metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"paywall metric"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netValue(): number {
    return Math.round(this.attempts * this.updatedAt * 100) / 100;
  }

  copy(): PaywallMetric {
    return new PaywallMetric(
      this.code,
      this.label,
      this.attributes,
      this.attempts,
      this.channel,
      this.updatedAt,
      this.conversionRate,
      this.title,
      this.externalRef,
      this.segment,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a paywall metric in status proposed. */
export function newPaywallMetric(code: string, label: string): PaywallMetric {
  return new PaywallMetric(code, label, new Map<string, string>(), 0, "", 0, 0, "", "", "", "proposed");
}
