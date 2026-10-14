/**
 * The funnel manifest records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel manifest is in its life cycle. */
export type FunnelManifestStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a funnel manifest and its current status. */
export class FunnelManifest {
  code: string;
  label: string;
  summary: string;
  region: string;
  quantity: number;
  attributes: Map<string, string>;
  floorValue: number;
  currency: string;
  status: FunnelManifestStatus;

  constructor(
    code: string,
    label: string,
    summary: string,
    region: string,
    quantity: number,
    attributes: Map<string, string>,
    floorValue: number,
    currency: string,
    status: FunnelManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.summary = summary;
    this.region = region;
    this.quantity = quantity;
    this.attributes = attributes;
    this.floorValue = floorValue;
    this.currency = currency;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: FunnelManifestStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: FunnelManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round(this.floorValue * this.quantity * 100) / 100;
  }

  copy(): FunnelManifest {
    return new FunnelManifest(
      this.code,
      this.label,
      this.summary,
      this.region,
      this.quantity,
      this.attributes,
      this.floorValue,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a funnel manifest in status planned. */
export function newFunnelManifest(code: string, label: string): FunnelManifest {
  return new FunnelManifest(code, label, "", "", 0, new Map<string, string>(), 0, "", "planned");
}
