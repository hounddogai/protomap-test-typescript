/**
 * The warmup manifest records of deliverability's warmup work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a warmup manifest is in its life cycle. */
export type WarmupManifestStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One warmup manifest, with what the planners need to act on it. */
export class WarmupManifest {
  code: string;
  label: string;
  currency: string;
  unit: string;
  archived: boolean;
  amount: number;
  status: WarmupManifestStatus;

  constructor(
    code: string,
    label: string,
    currency: string,
    unit: string,
    archived: boolean,
    amount: number,
    status: WarmupManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.currency = currency;
    this.unit = unit;
    this.archived = archived;
    this.amount = amount;
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

  canMoveTo(next: WarmupManifestStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: WarmupManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`warmup manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): WarmupManifest {
    return new WarmupManifest(this.code, this.label, this.currency, this.unit, this.archived, this.amount, this.status);
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a warmup manifest in status idle. */
export function newWarmupManifest(code: string, label: string): WarmupManifest {
  return new WarmupManifest(code, label, "", "", false, 0, "idle");
}
