import * as text from "../../../../kit/text.js";

/** Where a bounce manifest is in its life cycle. */
export type BounceManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A bounce manifest as the bounce team keeps it. */
export class BounceManifest {
  code: string;
  name: string;
  frequencyCap: number;
  openRate: number;
  rate: number;
  campaignRef: string;
  capacity: number;
  unit: string;
  status: BounceManifestStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    openRate: number,
    rate: number,
    campaignRef: string,
    capacity: number,
    unit: string,
    status: BounceManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.openRate = openRate;
    this.rate = rate;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.unit = unit;
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

  canMoveTo(next: BounceManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BounceManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`bounce manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"bounce manifest"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.capacity + this.openRate) * 100) / 100;
  }

  copy(): BounceManifest {
    return new BounceManifest(
      this.code,
      this.name,
      this.frequencyCap,
      this.openRate,
      this.rate,
      this.campaignRef,
      this.capacity,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a bounce manifest in status planned. */
export function newBounceManifest(code: string, name: string): BounceManifest {
  return new BounceManifest(code, name, 0, 0, 0, "", 0, "", "planned");
}
