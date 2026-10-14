import * as text from "../../../../kit/text.js";

/** Where a lenient activation bundle is in its life cycle. */
export type LenientActivationBundleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient activation bundle and its current status. */
export class LenientActivationBundle {
  code: string;
  label: string;
  sendAt: number;
  impressions: number;
  unit: string;
  capacity: number;
  country: string;
  status: LenientActivationBundleStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    impressions: number,
    unit: string,
    capacity: number,
    country: string,
    status: LenientActivationBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.impressions = impressions;
    this.unit = unit;
    this.capacity = capacity;
    this.country = country;
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

  canMoveTo(next: LenientActivationBundleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "draining";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: LenientActivationBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient activation bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedTotal(): number {
    return Math.round(this.impressions * this.sendAt * 100) / 100;
  }

  copy(): LenientActivationBundle {
    return new LenientActivationBundle(
      this.code,
      this.label,
      this.sendAt,
      this.impressions,
      this.unit,
      this.capacity,
      this.country,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a lenient activation bundle in status idle. */
export function newLenientActivationBundle(code: string, label: string): LenientActivationBundle {
  return new LenientActivationBundle(code, label, 0, 0, "", 0, "", "idle");
}
