import * as text from "../../../../kit/text.js";

/** Where a weighted preference mapping is in its life cycle. */
export type WeightedPreferenceMappingStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One weighted preference mapping, with what the planners need to act on it. */
export class WeightedPreferenceMapping {
  code: string;
  name: string;
  version: number;
  cost: number;
  pinned: boolean;
  clicks: number;
  locale: string;
  variant: string;
  status: WeightedPreferenceMappingStatus;

  constructor(
    code: string,
    name: string,
    version: number,
    cost: number,
    pinned: boolean,
    clicks: number,
    locale: string,
    variant: string,
    status: WeightedPreferenceMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.version = version;
    this.cost = cost;
    this.pinned = pinned;
    this.clicks = clicks;
    this.locale = locale;
    this.variant = variant;
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

  canMoveTo(next: WeightedPreferenceMappingStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "withdrawn";
      case "approved":
        return next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WeightedPreferenceMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted preference mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  weightedVolume(): number {
    return Math.round(this.cost * this.version * 100) / 100;
  }

  copy(): WeightedPreferenceMapping {
    return new WeightedPreferenceMapping(
      this.code,
      this.name,
      this.version,
      this.cost,
      this.pinned,
      this.clicks,
      this.locale,
      this.variant,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a weighted preference mapping in status proposed. */
export function newWeightedPreferenceMapping(code: string, name: string): WeightedPreferenceMapping {
  return new WeightedPreferenceMapping(code, name, 0, 0, false, 0, "", "", "proposed");
}
