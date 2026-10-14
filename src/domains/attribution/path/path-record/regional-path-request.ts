import * as text from "../../../../kit/text.js";

/** Where a regional path request is in its life cycle. */
export type RegionalPathRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A regional path request as the path team keeps it. */
export class RegionalPathRequest {
  code: string;
  name: string;
  category: string;
  rate: number;
  capacity: number;
  status: RegionalPathRequestStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    rate: number,
    capacity: number,
    status: RegionalPathRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.rate = rate;
    this.capacity = capacity;
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

  canMoveTo(next: RegionalPathRequestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: RegionalPathRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional path request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"regional path request"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.capacity * this.rate * 100) / 100;
  }

  copy(): RegionalPathRequest {
    return new RegionalPathRequest(this.code, this.name, this.category, this.rate, this.capacity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a regional path request in status new. */
export function newRegionalPathRequest(code: string, name: string): RegionalPathRequest {
  return new RegionalPathRequest(code, name, "", 0, 0, "new");
}
