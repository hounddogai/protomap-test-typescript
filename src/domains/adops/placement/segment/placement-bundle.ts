import * as text from "../../../../kit/text.js";

/** Where a placement bundle is in its life cycle. */
export type PlacementBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One placement bundle, with what the planners need to act on it. */
export class PlacementBundle {
  code: string;
  label: string;
  createdAt: number;
  currency: string;
  revision: number;
  checksum: string;
  unit: string;
  margin: number;
  summary: string;
  frequencyCap: number;
  status: PlacementBundleStatus;

  constructor(
    code: string,
    label: string,
    createdAt: number,
    currency: string,
    revision: number,
    checksum: string,
    unit: string,
    margin: number,
    summary: string,
    frequencyCap: number,
    status: PlacementBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.createdAt = createdAt;
    this.currency = currency;
    this.revision = revision;
    this.checksum = checksum;
    this.unit = unit;
    this.margin = margin;
    this.summary = summary;
    this.frequencyCap = frequencyCap;
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

  canMoveTo(next: PlacementBundleStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "queued":
        return next === "running" || next === "done";
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PlacementBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedTotal(): number {
    return Math.round((this.createdAt + this.margin) * 100) / 100;
  }

  copy(): PlacementBundle {
    return new PlacementBundle(
      this.code,
      this.label,
      this.createdAt,
      this.currency,
      this.revision,
      this.checksum,
      this.unit,
      this.margin,
      this.summary,
      this.frequencyCap,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a placement bundle in status new. */
export function newPlacementBundle(code: string, label: string): PlacementBundle {
  return new PlacementBundle(code, label, 0, "", 0, "", "", 0, "", 0, "new");
}
