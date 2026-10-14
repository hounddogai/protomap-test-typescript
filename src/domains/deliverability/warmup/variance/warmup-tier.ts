import * as text from "../../../../kit/text.js";

/** Where a warmup tier is in its life cycle. */
export type WarmupTierStatus = "new" | "queued" | "running" | "done" | "failed";

/** A warmup tier. Its code is unique within a tenant. */
export class WarmupTier {
  code: string;
  title: string;
  country: string;
  startsAt: number;
  minimum: number;
  segment: string;
  capacity: number;
  cohort: string;
  checksum: string;
  description: string;
  notes: string;
  status: WarmupTierStatus;

  constructor(
    code: string,
    title: string,
    country: string,
    startsAt: number,
    minimum: number,
    segment: string,
    capacity: number,
    cohort: string,
    checksum: string,
    description: string,
    notes: string,
    status: WarmupTierStatus,
  ) {
    this.code = code;
    this.title = title;
    this.country = country;
    this.startsAt = startsAt;
    this.minimum = minimum;
    this.segment = segment;
    this.capacity = capacity;
    this.cohort = cohort;
    this.checksum = checksum;
    this.description = description;
    this.notes = notes;
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

  canMoveTo(next: WarmupTierStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WarmupTierStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup tier ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  weightedExposure(): number {
    return Math.round(this.minimum * this.capacity * 100) / 100;
  }

  copy(): WarmupTier {
    return new WarmupTier(
      this.code,
      this.title,
      this.country,
      this.startsAt,
      this.minimum,
      this.segment,
      this.capacity,
      this.cohort,
      this.checksum,
      this.description,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a warmup tier in status new. */
export function newWarmupTier(code: string, title: string): WarmupTier {
  return new WarmupTier(code, title, "", 0, 0, "", 0, "", "", "", "", "new");
}
