import * as text from "../../../../kit/text.js";

/** Where a strict warmup manifest is in its life cycle. */
export type StrictWarmupManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One strict warmup manifest, with what the planners need to act on it. */
export class StrictWarmupManifest {
  code: string;
  title: string;
  budget: number;
  region: string;
  utmSource: string;
  cohort: string;
  journeyId: string;
  version: number;
  margin: number;
  capacity: number;
  status: StrictWarmupManifestStatus;

  constructor(
    code: string,
    title: string,
    budget: number,
    region: string,
    utmSource: string,
    cohort: string,
    journeyId: string,
    version: number,
    margin: number,
    capacity: number,
    status: StrictWarmupManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.budget = budget;
    this.region = region;
    this.utmSource = utmSource;
    this.cohort = cohort;
    this.journeyId = journeyId;
    this.version = version;
    this.margin = margin;
    this.capacity = capacity;
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

  canMoveTo(next: StrictWarmupManifestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved" || next === "archived";
      case "resolved":
        return next === "reopened";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: StrictWarmupManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict warmup manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  netExposure(): number {
    return Math.round((this.margin - this.version) * 100) / 100;
  }

  copy(): StrictWarmupManifest {
    return new StrictWarmupManifest(
      this.code,
      this.title,
      this.budget,
      this.region,
      this.utmSource,
      this.cohort,
      this.journeyId,
      this.version,
      this.margin,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a strict warmup manifest in status open. */
export function newStrictWarmupManifest(code: string, title: string): StrictWarmupManifest {
  return new StrictWarmupManifest(code, title, 0, "", "", "", "", 0, 0, 0, "open");
}
