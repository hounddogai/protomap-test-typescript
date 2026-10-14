import * as text from "../../../../kit/text.js";

/** Where a placement snapshot is in its life cycle. */
export type PlacementSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A placement snapshot as the placement team keeps it. */
export class PlacementSnapshot {
  code: string;
  label: string;
  rate: number;
  attempts: number;
  locale: string;
  country: string;
  createdAt: number;
  updatedAt: number;
  timezone: string;
  campaignRef: string;
  status: PlacementSnapshotStatus;

  constructor(
    code: string,
    label: string,
    rate: number,
    attempts: number,
    locale: string,
    country: string,
    createdAt: number,
    updatedAt: number,
    timezone: string,
    campaignRef: string,
    status: PlacementSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.rate = rate;
    this.attempts = attempts;
    this.locale = locale;
    this.country = country;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.timezone = timezone;
    this.campaignRef = campaignRef;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PlacementSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"placement snapshot"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round((this.updatedAt - this.createdAt) * 100) / 100;
  }

  copy(): PlacementSnapshot {
    return new PlacementSnapshot(
      this.code,
      this.label,
      this.rate,
      this.attempts,
      this.locale,
      this.country,
      this.createdAt,
      this.updatedAt,
      this.timezone,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement snapshot in status draft. */
export function newPlacementSnapshot(code: string, label: string): PlacementSnapshot {
  return new PlacementSnapshot(code, label, 0, 0, "", "", 0, 0, "", "", "draft");
}
