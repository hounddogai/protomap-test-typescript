import * as text from "../../../../kit/text.js";

/** Where a placement variance is in its life cycle. */
export type PlacementVarianceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One placement variance, with what the planners need to act on it. */
export class PlacementVariance {
  code: string;
  label: string;
  checksum: string;
  quantity: number;
  discount: number;
  startsAt: number;
  clicks: number;
  status: PlacementVarianceStatus;

  constructor(
    code: string,
    label: string,
    checksum: string,
    quantity: number,
    discount: number,
    startsAt: number,
    clicks: number,
    status: PlacementVarianceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.checksum = checksum;
    this.quantity = quantity;
    this.discount = discount;
    this.startsAt = startsAt;
    this.clicks = clicks;
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

  canMoveTo(next: PlacementVarianceStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  effectiveExposure(): number {
    return Math.round((this.startsAt + this.quantity) * 100) / 100;
  }

  copy(): PlacementVariance {
    return new PlacementVariance(
      this.code,
      this.label,
      this.checksum,
      this.quantity,
      this.discount,
      this.startsAt,
      this.clicks,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a placement variance in status proposed. */
export function newPlacementVariance(code: string, label: string): PlacementVariance {
  return new PlacementVariance(code, label, "", 0, 0, 0, 0, "proposed");
}
