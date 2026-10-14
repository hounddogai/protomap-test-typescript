import * as text from "../../../../kit/text.js";

/** Where a default sla metric is in its life cycle. */
export type DefaultSlaMetricStatus = "requested" | "granted" | "revoked" | "expired";

/** A default sla metric as the sla team keeps it. */
export class DefaultSlaMetric {
  code: string;
  title: string;
  expiresAt: number;
  currency: string;
  variant: string;
  floorValue: number;
  status: DefaultSlaMetricStatus;

  constructor(
    code: string,
    title: string,
    expiresAt: number,
    currency: string,
    variant: string,
    floorValue: number,
    status: DefaultSlaMetricStatus,
  ) {
    this.code = code;
    this.title = title;
    this.expiresAt = expiresAt;
    this.currency = currency;
    this.variant = variant;
    this.floorValue = floorValue;
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

  canMoveTo(next: DefaultSlaMetricStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
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

  moveTo(next: DefaultSlaMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default sla metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netTotal(): number {
    return Math.round((this.expiresAt - this.floorValue) * 100) / 100;
  }

  copy(): DefaultSlaMetric {
    return new DefaultSlaMetric(
      this.code,
      this.title,
      this.expiresAt,
      this.currency,
      this.variant,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a default sla metric in status requested. */
export function newDefaultSlaMetric(code: string, title: string): DefaultSlaMetric {
  return new DefaultSlaMetric(code, title, 0, "", "", 0, "requested");
}
