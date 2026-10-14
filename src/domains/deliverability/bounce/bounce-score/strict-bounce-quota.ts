import * as text from "../../../../kit/text.js";

/** Where a strict bounce quota is in its life cycle. */
export type StrictBounceQuotaStatus = "requested" | "granted" | "revoked" | "expired";

/** One strict bounce quota, with what the planners need to act on it. */
export class StrictBounceQuota {
  code: string;
  name: string;
  minimum: number;
  budget: number;
  openRate: number;
  summary: string;
  status: StrictBounceQuotaStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    budget: number,
    openRate: number,
    summary: string,
    status: StrictBounceQuotaStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.budget = budget;
    this.openRate = openRate;
    this.summary = summary;
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

  canMoveTo(next: StrictBounceQuotaStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: StrictBounceQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict bounce quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  projectedExposure(): number {
    return Math.round((this.budget - this.openRate) * 100) / 100;
  }

  copy(): StrictBounceQuota {
    return new StrictBounceQuota(
      this.code,
      this.name,
      this.minimum,
      this.budget,
      this.openRate,
      this.summary,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict bounce quota in status requested. */
export function newStrictBounceQuota(code: string, name: string): StrictBounceQuota {
  return new StrictBounceQuota(code, name, 0, 0, 0, "", "requested");
}
