import * as text from "../../../../kit/text.js";

/** Where a adaptive cohort baseline is in its life cycle. */
export type AdaptiveCohortBaselineStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a adaptive cohort baseline and its current status. */
export class AdaptiveCohortBaseline {
  code: string;
  name: string;
  attributes: Map<string, string>;
  floorValue: number;
  quantity: number;
  updatedAt: number;
  campaignRef: string;
  weight: number;
  frequencyCap: number;
  status: AdaptiveCohortBaselineStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    floorValue: number,
    quantity: number,
    updatedAt: number,
    campaignRef: string,
    weight: number,
    frequencyCap: number,
    status: AdaptiveCohortBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.floorValue = floorValue;
    this.quantity = quantity;
    this.updatedAt = updatedAt;
    this.campaignRef = campaignRef;
    this.weight = weight;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: AdaptiveCohortBaselineStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveCohortBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive cohort baseline ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedExposure(): number {
    return Math.round((this.updatedAt + this.frequencyCap) * 100) / 100;
  }

  copy(): AdaptiveCohortBaseline {
    return new AdaptiveCohortBaseline(
      this.code,
      this.name,
      this.attributes,
      this.floorValue,
      this.quantity,
      this.updatedAt,
      this.campaignRef,
      this.weight,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive cohort baseline in status proposed. */
export function newAdaptiveCohortBaseline(code: string, name: string): AdaptiveCohortBaseline {
  return new AdaptiveCohortBaseline(code, name, new Map<string, string>(), 0, 0, 0, "", 0, 0, "proposed");
}
