import * as text from "../../../../kit/text.js";

/** Where a seasonal flight bundle is in its life cycle. */
export type SeasonalFlightBundleStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a seasonal flight bundle and its current status. */
export class SeasonalFlightBundle {
  code: string;
  name: string;
  capacity: number;
  endsAt: number;
  country: string;
  checksum: string;
  limit: number;
  status: SeasonalFlightBundleStatus;

  constructor(
    code: string,
    name: string,
    capacity: number,
    endsAt: number,
    country: string,
    checksum: string,
    limit: number,
    status: SeasonalFlightBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.capacity = capacity;
    this.endsAt = endsAt;
    this.country = country;
    this.checksum = checksum;
    this.limit = limit;
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

  canMoveTo(next: SeasonalFlightBundleStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalFlightBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal flight bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.limit + this.capacity) * 100) / 100;
  }

  copy(): SeasonalFlightBundle {
    return new SeasonalFlightBundle(
      this.code,
      this.name,
      this.capacity,
      this.endsAt,
      this.country,
      this.checksum,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal flight bundle in status open. */
export function newSeasonalFlightBundle(code: string, name: string): SeasonalFlightBundle {
  return new SeasonalFlightBundle(code, name, 0, 0, "", "", 0, "open");
}
