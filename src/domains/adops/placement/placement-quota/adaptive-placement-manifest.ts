import * as text from "../../../../kit/text.js";

/** Where a adaptive placement manifest is in its life cycle. */
export type AdaptivePlacementManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A adaptive placement manifest as the placement team keeps it. */
export class AdaptivePlacementManifest {
  code: string;
  label: string;
  createdAt: number;
  version: number;
  priority: number;
  weight: number;
  startsAt: number;
  updatedAt: number;
  revision: number;
  floorValue: number;
  quantity: number;
  status: AdaptivePlacementManifestStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    version: number,
    priority: number,
    weight: number,
    startsAt: number,
    updatedAt: number,
    revision: number,
    floorValue: number,
    quantity: number,
    status: AdaptivePlacementManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.version = version;
    this.priority = priority;
    this.weight = weight;
    this.startsAt = startsAt;
    this.updatedAt = updatedAt;
    this.revision = revision;
    this.floorValue = floorValue;
    this.quantity = quantity;
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

  canMoveTo(next: AdaptivePlacementManifestStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "done":
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
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptivePlacementManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive placement manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  displayLabel(): string {
    return `${"adaptive placement manifest"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.version - this.revision) * 100) / 100;
  }

  copy(): AdaptivePlacementManifest {
    return new AdaptivePlacementManifest(
      this.code,
      this.label,
      this.createdAt,
      this.version,
      this.priority,
      this.weight,
      this.startsAt,
      this.updatedAt,
      this.revision,
      this.floorValue,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive placement manifest in status new. */
export function newAdaptivePlacementManifest(code: string, label: string): AdaptivePlacementManifest {
  return new AdaptivePlacementManifest(code, label, 0, 0, 0, 0, 0, 0, 0, 0, 0, "new");
}
