import * as text from "../../../../kit/text.js";

/** Where a fallback suppression mapping is in its life cycle. */
export type FallbackSuppressionMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback suppression mapping, with what the planners need to act on it. */
export class FallbackSuppressionMapping {
  code: string;
  label: string;
  attributes: Map<string, string>;
  budget: number;
  startsAt: number;
  archived: boolean;
  floorValue: number;
  source: string;
  unit: string;
  status: FallbackSuppressionMappingStatus;

  constructor(
    code: string,
    label: string,
    attributes: Map<string, string>,
    budget: number,
    startsAt: number,
    archived: boolean,
    floorValue: number,
    source: string,
    unit: string,
    status: FallbackSuppressionMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.attributes = attributes;
    this.budget = budget;
    this.startsAt = startsAt;
    this.archived = archived;
    this.floorValue = floorValue;
    this.source = source;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackSuppressionMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackSuppressionMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback suppression mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"fallback suppression mapping"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedTotal(): number {
    return Math.round((this.floorValue - this.startsAt) * 100) / 100;
  }

  copy(): FallbackSuppressionMapping {
    return new FallbackSuppressionMapping(
      this.code,
      this.label,
      this.attributes,
      this.budget,
      this.startsAt,
      this.archived,
      this.floorValue,
      this.source,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback suppression mapping in status idle. */
export function newFallbackSuppressionMapping(code: string, label: string): FallbackSuppressionMapping {
  return new FallbackSuppressionMapping(code, label, new Map<string, string>(), 0, 0, false, 0, "", "", "idle");
}
