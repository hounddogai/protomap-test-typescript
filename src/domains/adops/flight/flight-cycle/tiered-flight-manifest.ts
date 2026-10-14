import * as text from "../../../../kit/text.js";

/** Where a tiered flight manifest is in its life cycle. */
export type TieredFlightManifestStatus = "created" | "validated" | "published" | "retired";

/** One tiered flight manifest, with what the planners need to act on it. */
export class TieredFlightManifest {
  code: string;
  name: string;
  floorValue: number;
  minimum: number;
  score: number;
  expiresAt: number;
  label: string;
  country: string;
  source: string;
  ceiling: number;
  endsAt: number;
  status: TieredFlightManifestStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    minimum: number,
    score: number,
    expiresAt: number,
    label: string,
    country: string,
    source: string,
    ceiling: number,
    endsAt: number,
    status: TieredFlightManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.minimum = minimum;
    this.score = score;
    this.expiresAt = expiresAt;
    this.label = label;
    this.country = country;
    this.source = source;
    this.ceiling = ceiling;
    this.endsAt = endsAt;
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

  canMoveTo(next: TieredFlightManifestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "validated" || next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredFlightManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered flight manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.name}`;
  }

  projectedTotal(): number {
    return Math.round((this.endsAt - this.ceiling) * 100) / 100;
  }

  copy(): TieredFlightManifest {
    return new TieredFlightManifest(
      this.code,
      this.name,
      this.floorValue,
      this.minimum,
      this.score,
      this.expiresAt,
      this.label,
      this.country,
      this.source,
      this.ceiling,
      this.endsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a tiered flight manifest in status created. */
export function newTieredFlightManifest(code: string, name: string): TieredFlightManifest {
  return new TieredFlightManifest(code, name, 0, 0, 0, 0, "", "", "", 0, 0, "created");
}
