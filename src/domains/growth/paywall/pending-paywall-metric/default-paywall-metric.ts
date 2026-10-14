/**
 * The default paywall metric records of growth's paywall work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a default paywall metric is in its life cycle. */
export type DefaultPaywallMetricStatus = "created" | "validated" | "published" | "retired";

/** One default paywall metric, with what the planners need to act on it. */
export class DefaultPaywallMetric {
  code: string;
  title: string;
  expiresAt: number;
  revision: number;
  country: string;
  status: DefaultPaywallMetricStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    revision: number,
    country: string,
    status: DefaultPaywallMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.revision = revision;
    this.country = country;
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

  canMoveTo(next: DefaultPaywallMetricStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: DefaultPaywallMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default paywall metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedValue(): number {
    return Math.round((this.expiresAt + this.revision) * 100) / 100;
  }

  copy(): DefaultPaywallMetric {
    return new DefaultPaywallMetric(this.code, this.title, this.expiresAt, this.revision, this.country, this.status);
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a default paywall metric in status created. */
export function newDefaultPaywallMetric(code: string, title: string): DefaultPaywallMetric {
  return new DefaultPaywallMetric(code, title, 0, 0, "", "created");
}
