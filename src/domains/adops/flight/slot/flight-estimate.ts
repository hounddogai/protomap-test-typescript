import * as text from "../../../../kit/text.js";

/** Where a flight estimate is in its life cycle. */
export type FlightEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a flight estimate and its current status. */
export class FlightEstimate {
  code: string;
  name: string;
  score: number;
  rate: number;
  region: string;
  contactEmail: string;
  campaignRef: string;
  status: FlightEstimateStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    rate: number,
    region: string,
    contactEmail: string,
    campaignRef: string,
    status: FlightEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.rate = rate;
    this.region = region;
    this.contactEmail = contactEmail;
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

  canMoveTo(next: FlightEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FlightEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`flight estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netVolume(): number {
    return Math.round(this.score * this.rate * 100) / 100;
  }

  copy(): FlightEstimate {
    return new FlightEstimate(
      this.code,
      this.name,
      this.score,
      this.rate,
      this.region,
      this.contactEmail,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a flight estimate in status requested. */
export function newFlightEstimate(code: string, name: string): FlightEstimate {
  return new FlightEstimate(code, name, 0, 0, "", "", "", "requested");
}
