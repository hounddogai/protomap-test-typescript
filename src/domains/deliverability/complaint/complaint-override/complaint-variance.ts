import * as text from "../../../../kit/text.js";

/** Where a complaint variance is in its life cycle. */
export type ComplaintVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A complaint variance. Its code is unique within a tenant. */
export class ComplaintVariance {
  code: string;
  name: string;
  archived: boolean;
  utmSource: string;
  graceDays: number;
  country: string;
  variant: string;
  channel: string;
  version: number;
  capacity: number;
  status: ComplaintVarianceStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    utmSource: string,
    graceDays: number,
    country: string,
    variant: string,
    channel: string,
    version: number,
    capacity: number,
    status: ComplaintVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.utmSource = utmSource;
    this.graceDays = graceDays;
    this.country = country;
    this.variant = variant;
    this.channel = channel;
    this.version = version;
    this.capacity = capacity;
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

  canMoveTo(next: ComplaintVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: ComplaintVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`complaint variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netExposure(): number {
    return Math.round((this.capacity - this.graceDays) * 100) / 100;
  }

  copy(): ComplaintVariance {
    return new ComplaintVariance(
      this.code,
      this.name,
      this.archived,
      this.utmSource,
      this.graceDays,
      this.country,
      this.variant,
      this.channel,
      this.version,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a complaint variance in status proposed. */
export function newComplaintVariance(code: string, name: string): ComplaintVariance {
  return new ComplaintVariance(code, name, false, "", 0, "", "", "", 0, 0, "proposed");
}
