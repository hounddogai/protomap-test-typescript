import * as text from "../../../../kit/text.js";

/** Where a regional opt out bundle is in its life cycle. */
export type RegionalOptOutBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** A regional opt out bundle. Its code is unique within a tenant. */
export class RegionalOptOutBundle {
  code: string;
  name: string;
  locale: string;
  minimum: number;
  threshold: number;
  floorValue: number;
  graceDays: number;
  unit: string;
  impressions: number;
  tags: string[];
  ratio: number;
  status: RegionalOptOutBundleStatus;

  constructor(
    code: string,
    name: string,
    locale: string,
    minimum: number,
    threshold: number,
    floorValue: number,
    graceDays: number,
    unit: string,
    impressions: number,
    tags: string[],
    ratio: number,
    status: RegionalOptOutBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.locale = locale;
    this.minimum = minimum;
    this.threshold = threshold;
    this.floorValue = floorValue;
    this.graceDays = graceDays;
    this.unit = unit;
    this.impressions = impressions;
    this.tags = tags;
    this.ratio = ratio;
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

  canMoveTo(next: RegionalOptOutBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked" || next === "expired";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RegionalOptOutBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`regional opt out bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedLoad(): number {
    return Math.round((this.ratio + this.impressions) * 100) / 100;
  }

  copy(): RegionalOptOutBundle {
    return new RegionalOptOutBundle(
      this.code,
      this.name,
      this.locale,
      this.minimum,
      this.threshold,
      this.floorValue,
      this.graceDays,
      this.unit,
      this.impressions,
      this.tags,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a regional opt out bundle in status requested. */
export function newRegionalOptOutBundle(code: string, name: string): RegionalOptOutBundle {
  return new RegionalOptOutBundle(code, name, "", 0, 0, 0, 0, "", 0, [], 0, "requested");
}
