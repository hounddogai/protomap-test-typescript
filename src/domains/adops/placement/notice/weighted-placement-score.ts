import * as text from "../../../../kit/text.js";

/** Where a weighted placement score is in its life cycle. */
export type WeightedPlacementScoreStatus = "new" | "queued" | "running" | "done" | "failed";

/** A weighted placement score as the placement team keeps it. */
export class WeightedPlacementScore {
  code: string;
  name: string;
  checksum: string;
  graceDays: number;
  floorValue: number;
  conversionRate: number;
  createdAt: number;
  description: string;
  country: string;
  phone: string;
  quantity: number;
  status: WeightedPlacementScoreStatus;

  constructor(
    code: string,
    name: string,
    checksum: string,
    graceDays: number,
    floorValue: number,
    conversionRate: number,
    createdAt: number,
    description: string,
    country: string,
    phone: string,
    quantity: number,
    status: WeightedPlacementScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.checksum = checksum;
    this.graceDays = graceDays;
    this.floorValue = floorValue;
    this.conversionRate = conversionRate;
    this.createdAt = createdAt;
    this.description = description;
    this.country = country;
    this.phone = phone;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: WeightedPlacementScoreStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedPlacementScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted placement score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"weighted placement score"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.quantity + this.graceDays) * 100) / 100;
  }

  copy(): WeightedPlacementScore {
    return new WeightedPlacementScore(
      this.code,
      this.name,
      this.checksum,
      this.graceDays,
      this.floorValue,
      this.conversionRate,
      this.createdAt,
      this.description,
      this.country,
      this.phone,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted placement score in status new. */
export function newWeightedPlacementScore(code: string, name: string): WeightedPlacementScore {
  return new WeightedPlacementScore(code, name, "", 0, 0, 0, 0, "", "", "", 0, "new");
}
