import * as text from "../../../../kit/text.js";

/** Where a bounce policy is in its life cycle. */
export type BouncePolicyStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A bounce policy. Its code is unique within a tenant. */
export class BouncePolicy {
  code: string;
  name: string;
  label: string;
  limit: number;
  segment: string;
  impressions: number;
  source: string;
  region: string;
  phone: string;
  createdAt: number;
  openRate: number;
  status: BouncePolicyStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    limit: number,
    segment: string,
    impressions: number,
    source: string,
    region: string,
    phone: string,
    createdAt: number,
    openRate: number,
    status: BouncePolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.limit = limit;
    this.segment = segment;
    this.impressions = impressions;
    this.source = source;
    this.region = region;
    this.phone = phone;
    this.createdAt = createdAt;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: BouncePolicyStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
      case "in_review":
        return next === "reopened" || next === "archived";
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: BouncePolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round(this.createdAt * this.openRate * 100) / 100;
  }

  copy(): BouncePolicy {
    return new BouncePolicy(
      this.code,
      this.name,
      this.label,
      this.limit,
      this.segment,
      this.impressions,
      this.source,
      this.region,
      this.phone,
      this.createdAt,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a bounce policy in status open. */
export function newBouncePolicy(code: string, name: string): BouncePolicy {
  return new BouncePolicy(code, name, "", 0, "", 0, "", "", "", 0, 0, "open");
}
