/**
 * The adaptive flight snapshot records of adops's flight work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a adaptive flight snapshot is in its life cycle. */
export type AdaptiveFlightSnapshotStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A adaptive flight snapshot. Its code is unique within a tenant. */
export class AdaptiveFlightSnapshot {
  code: string;
  label: string;
  ratio: number;
  region: string;
  expiresAt: number;
  margin: number;
  attributes: Map<string, string>;
  sendAt: number;
  floorValue: number;
  status: AdaptiveFlightSnapshotStatus;

  constructor(
    code: string,
    label: string,
    ratio: number,
    region: string,
    expiresAt: number,
    margin: number,
    attributes: Map<string, string>,
    sendAt: number,
    floorValue: number,
    status: AdaptiveFlightSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.ratio = ratio;
    this.region = region;
    this.expiresAt = expiresAt;
    this.margin = margin;
    this.attributes = attributes;
    this.sendAt = sendAt;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveFlightSnapshotStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "pending";
      case "pending":
        switch (next) {
          case "active":
          case "suspended":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveFlightSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive flight snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
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

  netLoad(): number {
    return Math.round(this.sendAt * this.expiresAt * 100) / 100;
  }

  copy(): AdaptiveFlightSnapshot {
    return new AdaptiveFlightSnapshot(
      this.code,
      this.label,
      this.ratio,
      this.region,
      this.expiresAt,
      this.margin,
      this.attributes,
      this.sendAt,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a adaptive flight snapshot in status draft. */
export function newAdaptiveFlightSnapshot(code: string, label: string): AdaptiveFlightSnapshot {
  return new AdaptiveFlightSnapshot(code, label, 0, "", 0, 0, new Map<string, string>(), 0, 0, "draft");
}
