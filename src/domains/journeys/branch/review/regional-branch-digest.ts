import * as text from "../../../../kit/text.js";

/** Where a regional branch digest is in its life cycle. */
export type RegionalBranchDigestStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A regional branch digest. Its code is unique within a tenant. */
export class RegionalBranchDigest {
  code: string;
  title: string;
  limit: number;
  channel: string;
  budget: number;
  maximum: number;
  conversionRate: number;
  active: boolean;
  country: string;
  status: RegionalBranchDigestStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    channel: string,
    budget: number,
    maximum: number,
    conversionRate: number,
    active: boolean,
    country: string,
    status: RegionalBranchDigestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.channel = channel;
    this.budget = budget;
    this.maximum = maximum;
    this.conversionRate = conversionRate;
    this.active = active;
    this.country = country;
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

  canMoveTo(next: RegionalBranchDigestStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: RegionalBranchDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional branch digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional branch digest"} ${this.code}`;
  }

  effectiveTotal(): number {
    return Math.round(this.maximum * this.limit * 100) / 100;
  }

  copy(): RegionalBranchDigest {
    return new RegionalBranchDigest(
      this.code,
      this.title,
      this.limit,
      this.channel,
      this.budget,
      this.maximum,
      this.conversionRate,
      this.active,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a regional branch digest in status proposed. */
export function newRegionalBranchDigest(code: string, title: string): RegionalBranchDigest {
  return new RegionalBranchDigest(code, title, 0, "", 0, 0, 0, false, "", "proposed");
}
