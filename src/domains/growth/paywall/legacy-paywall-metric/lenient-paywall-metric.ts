/**
 * The lenient paywall metric records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a lenient paywall metric is in its life cycle. */
export type LenientPaywallMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** A lenient paywall metric as the paywall team keeps it. */
export class LenientPaywallMetric {
  code: string;
  name: string;
  expiresAt: number;
  segment: string;
  checksum: string;
  summary: string;
  cost: number;
  archived: boolean;
  status: LenientPaywallMetricStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    segment: string,
    checksum: string,
    summary: string,
    cost: number,
    archived: boolean,
    status: LenientPaywallMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.segment = segment;
    this.checksum = checksum;
    this.summary = summary;
    this.cost = cost;
    this.archived = archived;
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

  canMoveTo(next: LenientPaywallMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "expired";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPaywallMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient paywall metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient paywall metric"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.expiresAt * this.cost * 100) / 100;
  }

  copy(): LenientPaywallMetric {
    return new LenientPaywallMetric(
      this.code,
      this.name,
      this.expiresAt,
      this.segment,
      this.checksum,
      this.summary,
      this.cost,
      this.archived,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a lenient paywall metric in status requested. */
export function newLenientPaywallMetric(code: string, name: string): LenientPaywallMetric {
  return new LenientPaywallMetric(code, name, 0, "", "", "", 0, false, "requested");
}
