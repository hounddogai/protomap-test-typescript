import * as text from "../../../../kit/text.js";

/** Where a adaptive opt out metric is in its life cycle. */
export type AdaptiveOptOutMetricStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive opt out metric as the opt out team keeps it. */
export class AdaptiveOptOutMetric {
  code: string;
  name: string;
  contactEmail: string;
  conversionRate: number;
  revision: number;
  archived: boolean;
  bid: number;
  createdAt: number;
  status: AdaptiveOptOutMetricStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    conversionRate: number,
    revision: number,
    archived: boolean,
    bid: number,
    createdAt: number,
    status: AdaptiveOptOutMetricStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.conversionRate = conversionRate;
    this.revision = revision;
    this.archived = archived;
    this.bid = bid;
    this.createdAt = createdAt;
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

  canMoveTo(next: AdaptiveOptOutMetricStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveOptOutMetricStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive opt out metric ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedExposure(): number {
    return Math.round((this.createdAt + this.revision) * 100) / 100;
  }

  copy(): AdaptiveOptOutMetric {
    return new AdaptiveOptOutMetric(
      this.code,
      this.name,
      this.contactEmail,
      this.conversionRate,
      this.revision,
      this.archived,
      this.bid,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive opt out metric in status proposed. */
export function newAdaptiveOptOutMetric(code: string, name: string): AdaptiveOptOutMetric {
  return new AdaptiveOptOutMetric(code, name, "", 0, 0, false, 0, 0, "proposed");
}
