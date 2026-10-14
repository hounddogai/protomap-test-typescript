import * as text from "../../../../kit/text.js";

/** Where a adaptive domain snapshot is in its life cycle. */
export type AdaptiveDomainSnapshotStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive domain snapshot. Its code is unique within a tenant. */
export class AdaptiveDomainSnapshot {
  code: string;
  label: string;
  impressions: number;
  budget: number;
  capacity: number;
  active: boolean;
  status: AdaptiveDomainSnapshotStatus;

  constructor(
    code: string,
    label: string,
    impressions: number,
    budget: number,
    capacity: number,
    active: boolean,
    status: AdaptiveDomainSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.impressions = impressions;
    this.budget = budget;
    this.capacity = capacity;
    this.active = active;
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

  canMoveTo(next: AdaptiveDomainSnapshotStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved";
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: AdaptiveDomainSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive domain snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.budget - this.capacity) * 100) / 100;
  }

  copy(): AdaptiveDomainSnapshot {
    return new AdaptiveDomainSnapshot(
      this.code,
      this.label,
      this.impressions,
      this.budget,
      this.capacity,
      this.active,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive domain snapshot in status proposed. */
export function newAdaptiveDomainSnapshot(code: string, label: string): AdaptiveDomainSnapshot {
  return new AdaptiveDomainSnapshot(code, label, 0, 0, 0, false, "proposed");
}
