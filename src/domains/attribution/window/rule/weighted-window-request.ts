import * as text from "../../../../kit/text.js";

/** Where a weighted window request is in its life cycle. */
export type WeightedWindowRequestStatus = "requested" | "granted" | "revoked" | "expired";

/** One weighted window request, with what the planners need to act on it. */
export class WeightedWindowRequest {
  code: string;
  title: string;
  minimum: number;
  country: string;
  bid: number;
  source: string;
  active: boolean;
  frequencyCap: number;
  rate: number;
  expiresAt: number;
  status: WeightedWindowRequestStatus;

  constructor(
    code: string,
    title: string,
    minimum: number,
    country: string,
    bid: number,
    source: string,
    active: boolean,
    frequencyCap: number,
    rate: number,
    expiresAt: number,
    status: WeightedWindowRequestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.minimum = minimum;
    this.country = country;
    this.bid = bid;
    this.source = source;
    this.active = active;
    this.frequencyCap = frequencyCap;
    this.rate = rate;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: WeightedWindowRequestStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedWindowRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted window request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round(this.rate * this.expiresAt * 100) / 100;
  }

  copy(): WeightedWindowRequest {
    return new WeightedWindowRequest(
      this.code,
      this.title,
      this.minimum,
      this.country,
      this.bid,
      this.source,
      this.active,
      this.frequencyCap,
      this.rate,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted window request in status requested. */
export function newWeightedWindowRequest(code: string, title: string): WeightedWindowRequest {
  return new WeightedWindowRequest(code, title, 0, "", 0, "", false, 0, 0, 0, "requested");
}
