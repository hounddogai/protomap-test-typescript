import * as text from "../../../../kit/text.js";

/** Where a placement preference is in its life cycle. */
export type PlacementPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a placement preference and its current status. */
export class PlacementPreference {
  code: string;
  name: string;
  reviewer: string;
  openRate: number;
  utmSource: string;
  attributes: Map<string, string>;
  minimum: number;
  campaignRef: string;
  status: PlacementPreferenceStatus;

  constructor(
    code: string,
    name: string,
    reviewer: string,
    openRate: number,
    utmSource: string,
    attributes: Map<string, string>,
    minimum: number,
    campaignRef: string,
    status: PlacementPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.reviewer = reviewer;
    this.openRate = openRate;
    this.utmSource = utmSource;
    this.attributes = attributes;
    this.minimum = minimum;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: PlacementPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PlacementPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedValue(): number {
    return Math.round(this.minimum * this.openRate * 100) / 100;
  }

  copy(): PlacementPreference {
    return new PlacementPreference(
      this.code,
      this.name,
      this.reviewer,
      this.openRate,
      this.utmSource,
      this.attributes,
      this.minimum,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a placement preference in status proposed. */
export function newPlacementPreference(code: string, name: string): PlacementPreference {
  return new PlacementPreference(code, name, "", 0, "", new Map<string, string>(), 0, "", "proposed");
}
