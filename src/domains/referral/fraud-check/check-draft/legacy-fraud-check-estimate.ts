import * as text from "../../../../kit/text.js";

/** Where a legacy fraud check estimate is in its life cycle. */
export type LegacyFraudCheckEstimateStatus = "requested" | "granted" | "revoked" | "expired";

/** A legacy fraud check estimate as the fraud check team keeps it. */
export class LegacyFraudCheckEstimate {
  code: string;
  name: string;
  capacity: number;
  ownerId: string;
  attempts: number;
  updatedAt: number;
  version: number;
  description: string;
  externalRef: string;
  retries: number;
  country: string;
  status: LegacyFraudCheckEstimateStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    ownerId: string,
    attempts: number,
    updatedAt: number,
    version: number,
    description: string,
    externalRef: string,
    retries: number,
    country: string,
    status: LegacyFraudCheckEstimateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.updatedAt = updatedAt;
    this.version = version;
    this.description = description;
    this.externalRef = externalRef;
    this.retries = retries;
    this.country = country;
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

  canMoveTo(next: LegacyFraudCheckEstimateStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: LegacyFraudCheckEstimateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy fraud check estimate ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netVolume(): number {
    return Math.round((this.retries + this.updatedAt) * 100) / 100;
  }

  copy(): LegacyFraudCheckEstimate {
    return new LegacyFraudCheckEstimate(
      this.code,
      this.name,
      this.capacity,
      this.ownerId,
      this.attempts,
      this.updatedAt,
      this.version,
      this.description,
      this.externalRef,
      this.retries,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a legacy fraud check estimate in status requested. */
export function newLegacyFraudCheckEstimate(code: string, name: string): LegacyFraudCheckEstimate {
  return new LegacyFraudCheckEstimate(code, name, 0, "", 0, 0, 0, "", "", 0, "", "requested");
}
