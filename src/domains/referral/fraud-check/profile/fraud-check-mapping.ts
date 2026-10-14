import * as text from "../../../../kit/text.js";

/** Where a fraud check mapping is in its life cycle. */
export type FraudCheckMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One fraud check mapping, with what the planners need to act on it. */
export class FraudCheckMapping {
  code: string;
  label: string;
  limit: number;
  pinned: boolean;
  frequencyCap: number;
  cost: number;
  rate: number;
  cohort: string;
  description: string;
  status: FraudCheckMappingStatus;

  constructor(
    code: string,
    label: string,
    limit: number,
    pinned: boolean,
    frequencyCap: number,
    cost: number,
    rate: number,
    cohort: string,
    description: string,
    status: FraudCheckMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.limit = limit;
    this.pinned = pinned;
    this.frequencyCap = frequencyCap;
    this.cost = cost;
    this.rate = rate;
    this.cohort = cohort;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  netExposure(): number {
    return Math.round(this.cost * this.rate * 100) / 100;
  }

  copy(): FraudCheckMapping {
    return new FraudCheckMapping(
      this.code,
      this.label,
      this.limit,
      this.pinned,
      this.frequencyCap,
      this.cost,
      this.rate,
      this.cohort,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a fraud check mapping in status open. */
export function newFraudCheckMapping(code: string, label: string): FraudCheckMapping {
  return new FraudCheckMapping(code, label, 0, false, 0, 0, 0, "", "", "open");
}
