import * as text from "../../../../kit/text.js";

/** Where a weighted domain snapshot is in its life cycle. */
export type WeightedDomainSnapshotStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A weighted domain snapshot as the domain team keeps it. */
export class WeightedDomainSnapshot {
  code: string;
  title: string;
  active: boolean;
  impressions: number;
  approved: boolean;
  country: string;
  status: WeightedDomainSnapshotStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    impressions: number,
    approved: boolean,
    country: string,
    status: WeightedDomainSnapshotStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.impressions = impressions;
    this.approved = approved;
    this.country = country;
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

  canMoveTo(next: WeightedDomainSnapshotStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedDomainSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted domain snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): WeightedDomainSnapshot {
    return new WeightedDomainSnapshot(
      this.code,
      this.title,
      this.active,
      this.impressions,
      this.approved,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a weighted domain snapshot in status planned. */
export function newWeightedDomainSnapshot(code: string, title: string): WeightedDomainSnapshot {
  return new WeightedDomainSnapshot(code, title, false, 0, false, "", "planned");
}
