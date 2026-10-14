import * as text from "../../../../kit/text.js";

/** Where a seasonal badge manifest is in its life cycle. */
export type SeasonalBadgeManifestStatus = "created" | "validated" | "published" | "retired";

/** A seasonal badge manifest. Its code is unique within a tenant. */
export class SeasonalBadgeManifest {
  code: string;
  title: string;
  threshold: number;
  region: string;
  clicks: number;
  capacity: number;
  locale: string;
  batchSize: number;
  margin: number;
  checksum: string;
  status: SeasonalBadgeManifestStatus;

  constructor(
    code: string,
    title: string,
    threshold: number,
    region: string,
    clicks: number,
    capacity: number,
    locale: string,
    batchSize: number,
    margin: number,
    checksum: string,
    status: SeasonalBadgeManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.threshold = threshold;
    this.region = region;
    this.clicks = clicks;
    this.capacity = capacity;
    this.locale = locale;
    this.batchSize = batchSize;
    this.margin = margin;
    this.checksum = checksum;
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

  canMoveTo(next: SeasonalBadgeManifestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalBadgeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal badge manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  adjustedTotal(): number {
    return Math.round((this.batchSize - this.margin) * 100) / 100;
  }

  copy(): SeasonalBadgeManifest {
    return new SeasonalBadgeManifest(
      this.code,
      this.title,
      this.threshold,
      this.region,
      this.clicks,
      this.capacity,
      this.locale,
      this.batchSize,
      this.margin,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal badge manifest in status created. */
export function newSeasonalBadgeManifest(code: string, title: string): SeasonalBadgeManifest {
  return new SeasonalBadgeManifest(code, title, 0, "", 0, 0, "", 0, 0, "", "created");
}
