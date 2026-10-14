import * as text from "../../../../kit/text.js";

/** Where a lenient placement manifest is in its life cycle. */
export type LenientPlacementManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One lenient placement manifest, with what the planners need to act on it. */
export class LenientPlacementManifest {
  code: string;
  name: string;
  campaignRef: string;
  capacity: number;
  windowDays: number;
  status: LenientPlacementManifestStatus;

  constructor(
    code: string,
    name: string,
    campaignRef: string,
    capacity: number,
    windowDays: number,
    status: LenientPlacementManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.campaignRef = campaignRef;
    this.capacity = capacity;
    this.windowDays = windowDays;
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

  canMoveTo(next: LenientPlacementManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress";
      case "in_progress":
        switch (next) {
          case "completed":
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

  moveTo(next: LenientPlacementManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient placement manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  weightedExposure(): number {
    return Math.round((this.windowDays - this.capacity) * 100) / 100;
  }

  copy(): LenientPlacementManifest {
    return new LenientPlacementManifest(
      this.code,
      this.name,
      this.campaignRef,
      this.capacity,
      this.windowDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient placement manifest in status planned. */
export function newLenientPlacementManifest(code: string, name: string): LenientPlacementManifest {
  return new LenientPlacementManifest(code, name, "", 0, 0, "planned");
}
