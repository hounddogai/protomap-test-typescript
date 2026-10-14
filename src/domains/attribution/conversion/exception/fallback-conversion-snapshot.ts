import * as text from "../../../../kit/text.js";

/** Where a fallback conversion snapshot is in its life cycle. */
export type FallbackConversionSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A fallback conversion snapshot as the conversion team keeps it. */
export class FallbackConversionSnapshot {
  code: string;
  label: string;
  clicks: number;
  attributes: Map<string, string>;
  campaignRef: string;
  locale: string;
  attempts: number;
  notes: string;
  floorValue: number;
  status: FallbackConversionSnapshotStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    attributes: Map<string, string>,
    campaignRef: string,
    locale: string,
    attempts: number,
    notes: string,
    floorValue: number,
    status: FallbackConversionSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.attributes = attributes;
    this.campaignRef = campaignRef;
    this.locale = locale;
    this.attempts = attempts;
    this.notes = notes;
    this.floorValue = floorValue;
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

  canMoveTo(next: FallbackConversionSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "reopened" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
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
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackConversionSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback conversion snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveExposure(): number {
    return Math.round((this.floorValue + this.clicks) * 100) / 100;
  }

  copy(): FallbackConversionSnapshot {
    return new FallbackConversionSnapshot(
      this.code,
      this.label,
      this.clicks,
      this.attributes,
      this.campaignRef,
      this.locale,
      this.attempts,
      this.notes,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a fallback conversion snapshot in status open. */
export function newFallbackConversionSnapshot(code: string, label: string): FallbackConversionSnapshot {
  return new FallbackConversionSnapshot(code, label, 0, new Map<string, string>(), "", "", 0, "", 0, "open");
}
