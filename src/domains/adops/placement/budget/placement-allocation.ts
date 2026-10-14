import * as text from "../../../../kit/text.js";

/** Where a placement allocation is in its life cycle. */
export type PlacementAllocationStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a placement allocation and its current status. */
export class PlacementAllocation {
  code: string;
  name: string;
  label: string;
  quantity: number;
  version: number;
  limit: number;
  summary: string;
  pinned: boolean;
  threshold: number;
  locale: string;
  revision: number;
  status: PlacementAllocationStatus;

  constructor(
    code: string,
    name: string,
    label: string,
    quantity: number,
    version: number,
    limit: number,
    summary: string,
    pinned: boolean,
    threshold: number,
    locale: string,
    revision: number,
    status: PlacementAllocationStatus,
  ) {
    this.code = code;
    this.name = name;
    this.label = label;
    this.quantity = quantity;
    this.version = version;
    this.limit = limit;
    this.summary = summary;
    this.pinned = pinned;
    this.threshold = threshold;
    this.locale = locale;
    this.revision = revision;
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

  canMoveTo(next: PlacementAllocationStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected" || next === "withdrawn";
      case "approved":
        return next === "rejected";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedExposure(): number {
    return Math.round((this.quantity + this.threshold) * 100) / 100;
  }

  copy(): PlacementAllocation {
    return new PlacementAllocation(
      this.code,
      this.name,
      this.label,
      this.quantity,
      this.version,
      this.limit,
      this.summary,
      this.pinned,
      this.threshold,
      this.locale,
      this.revision,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement allocation in status proposed. */
export function newPlacementAllocation(code: string, name: string): PlacementAllocation {
  return new PlacementAllocation(code, name, "", 0, 0, 0, "", false, 0, "", 0, "proposed");
}
