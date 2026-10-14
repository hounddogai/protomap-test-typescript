import * as text from "../../../../kit/text.js";

/** Where a weighted flight plan is in its life cycle. */
export type WeightedFlightPlanStatus = "requested" | "granted" | "revoked" | "expired";

/** One weighted flight plan, with what the planners need to act on it. */
export class WeightedFlightPlan {
  code: string;
  name: string;
  contactEmail: string;
  version: number;
  clicks: number;
  floorValue: number;
  campaignRef: string;
  active: boolean;
  variant: string;
  region: string;
  status: WeightedFlightPlanStatus;

  constructor(
    code: string,
    name: string,
    contactEmail: string,
    version: number,
    clicks: number,
    floorValue: number,
    campaignRef: string,
    active: boolean,
    variant: string,
    region: string,
    status: WeightedFlightPlanStatus,
  ) {
    this.code = code;
    this.name = name;
    this.contactEmail = contactEmail;
    this.version = version;
    this.clicks = clicks;
    this.floorValue = floorValue;
    this.campaignRef = campaignRef;
    this.active = active;
    this.variant = variant;
    this.region = region;
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

  canMoveTo(next: WeightedFlightPlanStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
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

  moveTo(next: WeightedFlightPlanStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted flight plan ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.floorValue - this.version) * 100) / 100;
  }

  copy(): WeightedFlightPlan {
    return new WeightedFlightPlan(
      this.code,
      this.name,
      this.contactEmail,
      this.version,
      this.clicks,
      this.floorValue,
      this.campaignRef,
      this.active,
      this.variant,
      this.region,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a weighted flight plan in status requested. */
export function newWeightedFlightPlan(code: string, name: string): WeightedFlightPlan {
  return new WeightedFlightPlan(code, name, "", 0, 0, 0, "", false, "", "", "requested");
}
