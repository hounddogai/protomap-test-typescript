import * as text from "../../../../kit/text.js";

/** Where a funnel entry is in its life cycle. */
export type FunnelEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a funnel entry and its current status. */
export class FunnelEntry {
  code: string;
  label: string;
  weight: number;
  locale: string;
  threshold: number;
  attributes: Map<string, string>;
  startsAt: number;
  status: FunnelEntryStatus;

  constructor(
    code: string,
    label: string,
    weight: number,
    locale: string,
    threshold: number,
    attributes: Map<string, string>,
    startsAt: number,
    status: FunnelEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.weight = weight;
    this.locale = locale;
    this.threshold = threshold;
    this.attributes = attributes;
    this.startsAt = startsAt;
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

  canMoveTo(next: FunnelEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: FunnelEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveValue(): number {
    return Math.round((this.weight - this.threshold) * 100) / 100;
  }

  copy(): FunnelEntry {
    return new FunnelEntry(
      this.code,
      this.label,
      this.weight,
      this.locale,
      this.threshold,
      this.attributes,
      this.startsAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a funnel entry in status requested. */
export function newFunnelEntry(code: string, label: string): FunnelEntry {
  return new FunnelEntry(code, label, 0, "", 0, new Map<string, string>(), 0, "requested");
}
