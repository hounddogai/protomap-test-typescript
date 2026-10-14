import * as text from "../../../../kit/text.js";

/** Where a primary tier rollup is in its life cycle. */
export type PrimaryTierRollupStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary tier rollup. Its code is unique within a tenant. */
export class PrimaryTierRollup {
  code: string;
  label: string;
  capacity: number;
  campaignRef: string;
  region: string;
  status: PrimaryTierRollupStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    campaignRef: string,
    region: string,
    status: PrimaryTierRollupStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.campaignRef = campaignRef;
    this.region = region;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryTierRollupStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed" || next === "cancelled";
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryTierRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary tier rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  measuredValue(): number {
    return this.capacity;
  }

  copy(): PrimaryTierRollup {
    return new PrimaryTierRollup(this.code, this.label, this.capacity, this.campaignRef, this.region, this.status);
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a primary tier rollup in status planned. */
export function newPrimaryTierRollup(code: string, label: string): PrimaryTierRollup {
  return new PrimaryTierRollup(code, label, 0, "", "", "planned");
}
