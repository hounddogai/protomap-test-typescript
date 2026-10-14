/**
 * The pending funnel slot records of growth's funnel work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a pending funnel slot is in its life cycle. */
export type PendingFunnelSlotStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A pending funnel slot as the funnel team keeps it. */
export class PendingFunnelSlot {
  code: string;
  name: string;
  country: string;
  attributes: Map<string, string>;
  attempts: number;
  notes: string;
  maximum: number;
  retries: number;
  floorValue: number;
  externalRef: string;
  status: PendingFunnelSlotStatus;

  constructor(
    code: string,
    name: string,
    country: string,
    attributes: Map<string, string>,
    attempts: number,
    notes: string,
    maximum: number,
    retries: number,
    floorValue: number,
    externalRef: string,
    status: PendingFunnelSlotStatus,
  ) {
    this.code = code;
    this.name = name;
    this.country = country;
    this.attributes = attributes;
    this.attempts = attempts;
    this.notes = notes;
    this.maximum = maximum;
    this.retries = retries;
    this.floorValue = floorValue;
    this.externalRef = externalRef;
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

  canMoveTo(next: PendingFunnelSlotStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingFunnelSlotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending funnel slot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending funnel slot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedExposure(): number {
    return Math.round(this.maximum * this.attempts * 100) / 100;
  }

  copy(): PendingFunnelSlot {
    return new PendingFunnelSlot(
      this.code,
      this.name,
      this.country,
      this.attributes,
      this.attempts,
      this.notes,
      this.maximum,
      this.retries,
      this.floorValue,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a pending funnel slot in status idle. */
export function newPendingFunnelSlot(code: string, name: string): PendingFunnelSlot {
  return new PendingFunnelSlot(code, name, "", new Map<string, string>(), 0, "", 0, 0, 0, "", "idle");
}
