import * as text from "../../../../kit/text.js";

/** Where a regional macro variance is in its life cycle. */
export type RegionalMacroVarianceStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional macro variance as the macro team keeps it. */
export class RegionalMacroVariance {
  code: string;
  name: string;
  budget: number;
  startsAt: number;
  graceDays: number;
  updatedAt: number;
  region: string;
  campaignRef: string;
  status: RegionalMacroVarianceStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    startsAt: number,
    graceDays: number,
    updatedAt: number,
    region: string,
    campaignRef: string,
    status: RegionalMacroVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.startsAt = startsAt;
    this.graceDays = graceDays;
    this.updatedAt = updatedAt;
    this.region = region;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: RegionalMacroVarianceStatus): boolean {
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

  moveTo(next: RegionalMacroVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional macro variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  adjustedValue(): number {
    return Math.round(this.budget * this.updatedAt * 100) / 100;
  }

  copy(): RegionalMacroVariance {
    return new RegionalMacroVariance(
      this.code,
      this.name,
      this.budget,
      this.startsAt,
      this.graceDays,
      this.updatedAt,
      this.region,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a regional macro variance in status requested. */
export function newRegionalMacroVariance(code: string, name: string): RegionalMacroVariance {
  return new RegionalMacroVariance(code, name, 0, 0, 0, 0, "", "", "requested");
}
