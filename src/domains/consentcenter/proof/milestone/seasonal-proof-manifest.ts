import * as text from "../../../../kit/text.js";

/** Where a seasonal proof manifest is in its life cycle. */
export type SeasonalProofManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One seasonal proof manifest, with what the planners need to act on it. */
export class SeasonalProofManifest {
  code: string;
  name: string;
  region: string;
  unit: string;
  cost: number;
  revision: number;
  pinned: boolean;
  priority: number;
  conversionRate: number;
  status: SeasonalProofManifestStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    unit: string,
    cost: number,
    revision: number,
    pinned: boolean,
    priority: number,
    conversionRate: number,
    status: SeasonalProofManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.unit = unit;
    this.cost = cost;
    this.revision = revision;
    this.pinned = pinned;
    this.priority = priority;
    this.conversionRate = conversionRate;
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

  canMoveTo(next: SeasonalProofManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done" || next === "failed";
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalProofManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal proof manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  effectiveExposure(): number {
    return Math.round(this.revision * this.conversionRate * 100) / 100;
  }

  copy(): SeasonalProofManifest {
    return new SeasonalProofManifest(
      this.code,
      this.name,
      this.region,
      this.unit,
      this.cost,
      this.revision,
      this.pinned,
      this.priority,
      this.conversionRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal proof manifest in status new. */
export function newSeasonalProofManifest(code: string, name: string): SeasonalProofManifest {
  return new SeasonalProofManifest(code, name, "", "", 0, 0, false, 0, 0, "new");
}
