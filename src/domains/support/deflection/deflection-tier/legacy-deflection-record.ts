import * as text from "../../../../kit/text.js";

/** Where a legacy deflection record is in its life cycle. */
export type LegacyDeflectionRecordStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** The record of a legacy deflection record and its current status. */
export class LegacyDeflectionRecord {
  code: string;
  title: string;
  cost: number;
  startsAt: number;
  threshold: number;
  impressions: number;
  timezone: string;
  attributes: Map<string, string>;
  status: LegacyDeflectionRecordStatus;

  constructor(
    code: string,
    title: string,
    cost: number,
    startsAt: number,
    threshold: number,
    impressions: number,
    timezone: string,
    attributes: Map<string, string>,
    status: LegacyDeflectionRecordStatus,
  ) {
    this.code = code;
    this.title = title;
    this.cost = cost;
    this.startsAt = startsAt;
    this.threshold = threshold;
    this.impressions = impressions;
    this.timezone = timezone;
    this.attributes = attributes;
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

  canMoveTo(next: LegacyDeflectionRecordStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
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

  moveTo(next: LegacyDeflectionRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy deflection record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedVolume(): number {
    return Math.round((this.startsAt - this.cost) * 100) / 100;
  }

  copy(): LegacyDeflectionRecord {
    return new LegacyDeflectionRecord(
      this.code,
      this.title,
      this.cost,
      this.startsAt,
      this.threshold,
      this.impressions,
      this.timezone,
      this.attributes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a legacy deflection record in status proposed. */
export function newLegacyDeflectionRecord(code: string, title: string): LegacyDeflectionRecord {
  return new LegacyDeflectionRecord(code, title, 0, 0, 0, 0, "", new Map<string, string>(), "proposed");
}
