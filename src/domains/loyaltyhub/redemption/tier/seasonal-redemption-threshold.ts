import * as text from "../../../../kit/text.js";

/** Where a seasonal redemption threshold is in its life cycle. */
export type SeasonalRedemptionThresholdStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One seasonal redemption threshold, with what the planners need to act on it. */
export class SeasonalRedemptionThreshold {
  code: string;
  name: string;
  floorValue: number;
  utmSource: string;
  cost: number;
  attributes: Map<string, string>;
  timezone: string;
  source: string;
  version: number;
  status: SeasonalRedemptionThresholdStatus;

  constructor(
    code: string,
    name: string,
    floorValue: number,
    utmSource: string,
    cost: number,
    attributes: Map<string, string>,
    timezone: string,
    source: string,
    version: number,
    status: SeasonalRedemptionThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.floorValue = floorValue;
    this.utmSource = utmSource;
    this.cost = cost;
    this.attributes = attributes;
    this.timezone = timezone;
    this.source = source;
    this.version = version;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: SeasonalRedemptionThresholdStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "approved":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: SeasonalRedemptionThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal redemption threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"seasonal redemption threshold"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round(this.floorValue * this.version * 100) / 100;
  }

  copy(): SeasonalRedemptionThreshold {
    return new SeasonalRedemptionThreshold(
      this.code,
      this.name,
      this.floorValue,
      this.utmSource,
      this.cost,
      this.attributes,
      this.timezone,
      this.source,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a seasonal redemption threshold in status proposed. */
export function newSeasonalRedemptionThreshold(code: string, name: string): SeasonalRedemptionThreshold {
  return new SeasonalRedemptionThreshold(code, name, 0, "", 0, new Map<string, string>(), "", "", 0, "proposed");
}
