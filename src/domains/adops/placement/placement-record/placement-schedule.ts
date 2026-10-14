import * as text from "../../../../kit/text.js";

/** Where a placement schedule is in its life cycle. */
export type PlacementScheduleStatus = "created" | "validated" | "published" | "retired";

/** A placement schedule. Its code is unique within a tenant. */
export class PlacementSchedule {
  code: string;
  title: string;
  revision: number;
  quantity: number;
  retries: number;
  impressions: number;
  variant: string;
  version: number;
  region: string;
  description: string;
  status: PlacementScheduleStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    quantity: number,
    retries: number,
    impressions: number,
    variant: string,
    version: number,
    region: string,
    description: string,
    status: PlacementScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.quantity = quantity;
    this.retries = retries;
    this.impressions = impressions;
    this.variant = variant;
    this.version = version;
    this.region = region;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementScheduleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "published";
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PlacementScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveExposure(): number {
    return Math.round((this.quantity + this.revision) * 100) / 100;
  }

  copy(): PlacementSchedule {
    return new PlacementSchedule(
      this.code,
      this.title,
      this.revision,
      this.quantity,
      this.retries,
      this.impressions,
      this.variant,
      this.version,
      this.region,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a placement schedule in status created. */
export function newPlacementSchedule(code: string, title: string): PlacementSchedule {
  return new PlacementSchedule(code, title, 0, 0, 0, 0, "", 0, "", "", "created");
}
