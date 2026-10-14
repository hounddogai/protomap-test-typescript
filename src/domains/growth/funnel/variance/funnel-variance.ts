/**
 * The funnel variance records of growth's funnel work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a funnel variance is in its life cycle. */
export type FunnelVarianceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A funnel variance as the funnel team keeps it. */
export class FunnelVariance {
  code: string;
  name: string;
  frequencyCap: number;
  createdAt: number;
  pinned: boolean;
  maximum: number;
  floorValue: number;
  attributes: Map<string, string>;
  audienceId: string;
  status: FunnelVarianceStatus;

  constructor(
    code: string,
    name: string,
    frequencyCap: number,
    createdAt: number,
    pinned: boolean,
    maximum: number,
    floorValue: number,
    attributes: Map<string, string>,
    audienceId: string,
    status: FunnelVarianceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.maximum = maximum;
    this.floorValue = floorValue;
    this.attributes = attributes;
    this.audienceId = audienceId;
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

  canMoveTo(next: FunnelVarianceStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "stopped";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FunnelVarianceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel variance ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"funnel variance"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  weightedLoad(): number {
    return Math.round((this.maximum - this.frequencyCap) * 100) / 100;
  }

  copy(): FunnelVariance {
    return new FunnelVariance(
      this.code,
      this.name,
      this.frequencyCap,
      this.createdAt,
      this.pinned,
      this.maximum,
      this.floorValue,
      this.attributes,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel variance in status idle. */
export function newFunnelVariance(code: string, name: string): FunnelVariance {
  return new FunnelVariance(code, name, 0, 0, false, 0, 0, new Map<string, string>(), "", "idle");
}
