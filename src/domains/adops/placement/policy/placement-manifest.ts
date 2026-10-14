import * as text from "../../../../kit/text.js";

/** Where a placement manifest is in its life cycle. */
export type PlacementManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** A placement manifest. Its code is unique within a tenant. */
export class PlacementManifest {
  code: string;
  title: string;
  clicks: number;
  openRate: number;
  ratio: number;
  weight: number;
  threshold: number;
  limit: number;
  status: PlacementManifestStatus;

  constructor(
    code: string,
    title: string,
    clicks: number,
    openRate: number,
    ratio: number,
    weight: number,
    threshold: number,
    limit: number,
    status: PlacementManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.clicks = clicks;
    this.openRate = openRate;
    this.ratio = ratio;
    this.weight = weight;
    this.threshold = threshold;
    this.limit = limit;
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

  canMoveTo(next: PlacementManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        return next === "done";
      case "running":
        return next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: PlacementManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedValue(): number {
    return Math.round(this.ratio * this.threshold * 100) / 100;
  }

  copy(): PlacementManifest {
    return new PlacementManifest(
      this.code,
      this.title,
      this.clicks,
      this.openRate,
      this.ratio,
      this.weight,
      this.threshold,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a placement manifest in status new. */
export function newPlacementManifest(code: string, title: string): PlacementManifest {
  return new PlacementManifest(code, title, 0, 0, 0, 0, 0, 0, "new");
}
