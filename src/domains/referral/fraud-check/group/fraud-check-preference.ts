import * as text from "../../../../kit/text.js";

/** Where a fraud check preference is in its life cycle. */
export type FraudCheckPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One fraud check preference, with what the planners need to act on it. */
export class FraudCheckPreference {
  code: string;
  name: string;
  timezone: string;
  segment: string;
  cost: number;
  rate: number;
  updatedAt: number;
  batchSize: number;
  status: FraudCheckPreferenceStatus;

  constructor(
    code: string,
    name: string,
    timezone: string,
    segment: string,
    cost: number,
    rate: number,
    updatedAt: number,
    batchSize: number,
    status: FraudCheckPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.timezone = timezone;
    this.segment = segment;
    this.cost = cost;
    this.rate = rate;
    this.updatedAt = updatedAt;
    this.batchSize = batchSize;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fraud check preference"} ${this.code}`;
  }

  netVolume(): number {
    return Math.round((this.rate - this.updatedAt) * 100) / 100;
  }

  copy(): FraudCheckPreference {
    return new FraudCheckPreference(
      this.code,
      this.name,
      this.timezone,
      this.segment,
      this.cost,
      this.rate,
      this.updatedAt,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a fraud check preference in status draft. */
export function newFraudCheckPreference(code: string, name: string): FraudCheckPreference {
  return new FraudCheckPreference(code, name, "", "", 0, 0, 0, 0, "draft");
}
