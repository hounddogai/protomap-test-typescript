import * as text from "../../../../kit/text.js";

/** Where a cohort allocation is in its life cycle. */
export type CohortAllocationStatus = "requested" | "granted" | "revoked" | "expired";

/** One cohort allocation, with what the planners need to act on it. */
export class CohortAllocation {
  code: string;
  name: string;
  timezone: string;
  ratio: number;
  channel: string;
  region: string;
  minimum: number;
  category: string;
  version: number;
  currency: string;
  journeyId: string;
  status: CohortAllocationStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    ratio: number,
    channel: string,
    region: string,
    minimum: number,
    category: string,
    version: number,
    currency: string,
    journeyId: string,
    status: CohortAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.ratio = ratio;
    this.channel = channel;
    this.region = region;
    this.minimum = minimum;
    this.category = category;
    this.version = version;
    this.currency = currency;
    this.journeyId = journeyId;
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

  canMoveTo(next: CohortAllocationStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CohortAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`cohort allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  projectedLoad(): number {
    return Math.round((this.version - this.minimum) * 100) / 100;
  }

  copy(): CohortAllocation {
    return new CohortAllocation(
      this.code,
      this.name,
      this.timezone,
      this.ratio,
      this.channel,
      this.region,
      this.minimum,
      this.category,
      this.version,
      this.currency,
      this.journeyId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a cohort allocation in status requested. */
export function newCohortAllocation(code: string, name: string): CohortAllocation {
  return new CohortAllocation(code, name, "", 0, "", "", 0, "", 0, "", "", "requested");
}
