import * as text from "../../../../kit/text.js";

/** Where a fraud check manifest is in its life cycle. */
export type FraudCheckManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fraud check manifest, with what the planners need to act on it. */
export class FraudCheckManifest {
  code: string;
  label: string;
  unit: string;
  ownerId: string;
  attempts: number;
  attributes: Map<string, string>;
  windowDays: number;
  impressions: number;
  country: string;
  quantity: number;
  status: FraudCheckManifestStatus;

  constructor(
    code: string,
    label: string,
    unit: string,
    ownerId: string,
    attempts: number,
    attributes: Map<string, string>,
    windowDays: number,
    impressions: number,
    country: string,
    quantity: number,
    status: FraudCheckManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.unit = unit;
    this.ownerId = ownerId;
    this.attempts = attempts;
    this.attributes = attributes;
    this.windowDays = windowDays;
    this.impressions = impressions;
    this.country = country;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FraudCheckManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        return next === "running";
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FraudCheckManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fraud check manifest ${this.code} cannot move from ${this.status} to ${next}`);
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

  netExposure(): number {
    return Math.round((this.impressions - this.windowDays) * 100) / 100;
  }

  copy(): FraudCheckManifest {
    return new FraudCheckManifest(
      this.code,
      this.label,
      this.unit,
      this.ownerId,
      this.attempts,
      this.attributes,
      this.windowDays,
      this.impressions,
      this.country,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a fraud check manifest in status new. */
export function newFraudCheckManifest(code: string, label: string): FraudCheckManifest {
  return new FraudCheckManifest(code, label, "", "", 0, new Map<string, string>(), 0, 0, "", 0, "new");
}
