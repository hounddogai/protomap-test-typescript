import * as text from "../../../../kit/text.js";

/** Where a seasonal level override is in its life cycle. */
export type SeasonalLevelOverrideStatus = "requested" | "granted" | "revoked" | "expired";

/** A seasonal level override as the level team keeps it. */
export class SeasonalLevelOverride {
  code: string;
  title: string;
  campaignRef: string;
  revision: number;
  region: string;
  rate: number;
  label: string;
  status: SeasonalLevelOverrideStatus;

  constructor(
    code: string,
    title: string,
    campaignRef: string,
    revision: number,
    region: string,
    rate: number,
    label: string,
    status: SeasonalLevelOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.campaignRef = campaignRef;
    this.revision = revision;
    this.region = region;
    this.rate = rate;
    this.label = label;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalLevelOverrideStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalLevelOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal level override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.title}`;
  }

  projectedExposure(): number {
    return Math.round(this.rate * this.revision * 100) / 100;
  }

  copy(): SeasonalLevelOverride {
    return new SeasonalLevelOverride(
      this.code,
      this.title,
      this.campaignRef,
      this.revision,
      this.region,
      this.rate,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a seasonal level override in status requested. */
export function newSeasonalLevelOverride(code: string, title: string): SeasonalLevelOverride {
  return new SeasonalLevelOverride(code, title, "", 0, "", 0, "", "requested");
}
