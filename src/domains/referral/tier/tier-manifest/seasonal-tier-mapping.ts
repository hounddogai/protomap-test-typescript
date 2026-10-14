import * as text from "../../../../kit/text.js";

/** Where a seasonal tier mapping is in its life cycle. */
export type SeasonalTierMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A seasonal tier mapping as the tier team keeps it. */
export class SeasonalTierMapping {
  code: string;
  title: string;
  active: boolean;
  variant: string;
  version: number;
  retries: number;
  threshold: number;
  pinned: boolean;
  bid: number;
  openRate: number;
  status: SeasonalTierMappingStatus;

  constructor(
    code: string,
    title: string,
    active: boolean,
    variant: string,
    version: number,
    retries: number,
    threshold: number,
    pinned: boolean,
    bid: number,
    openRate: number,
    status: SeasonalTierMappingStatus,
  ) {
    this.code = code;
    this.title = title;
    this.active = active;
    this.variant = variant;
    this.version = version;
    this.retries = retries;
    this.threshold = threshold;
    this.pinned = pinned;
    this.bid = bid;
    this.openRate = openRate;
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

  canMoveTo(next: SeasonalTierMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: SeasonalTierMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal tier mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  weightedExposure(): number {
    return Math.round((this.retries + this.bid) * 100) / 100;
  }

  copy(): SeasonalTierMapping {
    return new SeasonalTierMapping(
      this.code,
      this.title,
      this.active,
      this.variant,
      this.version,
      this.retries,
      this.threshold,
      this.pinned,
      this.bid,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal tier mapping in status open. */
export function newSeasonalTierMapping(code: string, title: string): SeasonalTierMapping {
  return new SeasonalTierMapping(code, title, false, "", 0, 0, 0, false, 0, 0, "open");
}
