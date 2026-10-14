import * as text from "../../../../kit/text.js";

/** Where a wait metric is in its life cycle. */
export type WaitMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a wait metric and its current status. */
export class WaitMetric {
  code: string;
  name: string;
  variant: string;
  updatedAt: number;
  locale: string;
  reviewer: string;
  region: string;
  ownerId: string;
  clicks: number;
  source: string;
  contactEmail: string;
  status: WaitMetricStatus;

  constructor(
    code: string,
    name: string,
    variant: string,
    updatedAt: number,
    locale: string,
    reviewer: string,
    region: string,
    ownerId: string,
    clicks: number,
    source: string,
    contactEmail: string,
    status: WaitMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.variant = variant;
    this.updatedAt = updatedAt;
    this.locale = locale;
    this.reviewer = reviewer;
    this.region = region;
    this.ownerId = ownerId;
    this.clicks = clicks;
    this.source = source;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: WaitMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: WaitMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`wait metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedLoad(): number {
    return Math.round((this.updatedAt - this.clicks) * 100) / 100;
  }

  copy(): WaitMetric {
    return new WaitMetric(
      this.code,
      this.name,
      this.variant,
      this.updatedAt,
      this.locale,
      this.reviewer,
      this.region,
      this.ownerId,
      this.clicks,
      this.source,
      this.contactEmail,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a wait metric in status requested. */
export function newWaitMetric(code: string, name: string): WaitMetric {
  return new WaitMetric(code, name, "", 0, "", "", "", "", 0, "", "", "requested");
}
