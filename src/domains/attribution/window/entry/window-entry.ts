/**
 * The window entry records of attribution's window work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window entry is in its life cycle. */
export type WindowEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a window entry and its current status. */
export class WindowEntry {
  code: string;
  name: string;
  durationMinutes: number;
  region: string;
  attributes: Map<string, string>;
  threshold: number;
  quantity: number;
  utmSource: string;
  margin: number;
  status: WindowEntryStatus;

  constructor(
    code: string,
    name: string,
    durationMinutes: number,
    region: string,
    attributes: Map<string, string>,
    threshold: number,
    quantity: number,
    utmSource: string,
    margin: number,
    status: WindowEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.durationMinutes = durationMinutes;
    this.region = region;
    this.attributes = attributes;
    this.threshold = threshold;
    this.quantity = quantity;
    this.utmSource = utmSource;
    this.margin = margin;
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

  canMoveTo(next: WindowEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming";
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WindowEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.margin + this.durationMinutes) * 100) / 100;
  }

  copy(): WindowEntry {
    return new WindowEntry(
      this.code,
      this.name,
      this.durationMinutes,
      this.region,
      this.attributes,
      this.threshold,
      this.quantity,
      this.utmSource,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a window entry in status idle. */
export function newWindowEntry(code: string, name: string): WindowEntry {
  return new WindowEntry(code, name, 0, "", new Map<string, string>(), 0, 0, "", 0, "idle");
}
