import * as text from "../../../../kit/text.js";

/** Where a weighted reputation milestone is in its life cycle. */
export type WeightedReputationMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A weighted reputation milestone as the reputation team keeps it. */
export class WeightedReputationMilestone {
  code: string;
  name: string;
  country: string;
  limit: number;
  endsAt: number;
  region: string;
  sendAt: number;
  weight: number;
  updatedAt: number;
  startsAt: number;
  utmSource: string;
  status: WeightedReputationMilestoneStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    limit: number,
    endsAt: number,
    region: string,
    sendAt: number,
    weight: number,
    updatedAt: number,
    startsAt: number,
    utmSource: string,
    status: WeightedReputationMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.limit = limit;
    this.endsAt = endsAt;
    this.region = region;
    this.sendAt = sendAt;
    this.weight = weight;
    this.updatedAt = updatedAt;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
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

  canMoveTo(next: WeightedReputationMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
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

  moveTo(next: WeightedReputationMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted reputation milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netTotal(): number {
    return Math.round((this.limit - this.weight) * 100) / 100;
  }

  copy(): WeightedReputationMilestone {
    return new WeightedReputationMilestone(
      this.code,
      this.name,
      this.country,
      this.limit,
      this.endsAt,
      this.region,
      this.sendAt,
      this.weight,
      this.updatedAt,
      this.startsAt,
      this.utmSource,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted reputation milestone in status proposed. */
export function newWeightedReputationMilestone(code: string, name: string): WeightedReputationMilestone {
  return new WeightedReputationMilestone(code, name, "", 0, 0, "", 0, 0, 0, 0, "", "proposed");
}
