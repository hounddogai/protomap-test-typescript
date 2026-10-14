/**
 * The global complaint cycle records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global complaint cycle is in its life cycle. */
export type GlobalComplaintCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a global complaint cycle and its current status. */
export class GlobalComplaintCycle {
  code: string;
  name: string;
  impressions: number;
  rate: number;
  retries: number;
  journeyId: string;
  cost: number;
  durationMinutes: number;
  priority: number;
  attributes: Map<string, string>;
  visible: boolean;
  status: GlobalComplaintCycleStatus;

  constructor(
    code: string,
    name: string,
    impressions: number,
    rate: number,
    retries: number,
    journeyId: string,
    cost: number,
    durationMinutes: number,
    priority: number,
    attributes: Map<string, string>,
    visible: boolean,
    status: GlobalComplaintCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.impressions = impressions;
    this.rate = rate;
    this.retries = retries;
    this.journeyId = journeyId;
    this.cost = cost;
    this.durationMinutes = durationMinutes;
    this.priority = priority;
    this.attributes = attributes;
    this.visible = visible;
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

  canMoveTo(next: GlobalComplaintCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: GlobalComplaintCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global complaint cycle ${this.code} cannot move from ${this.status} to ${next}`);
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
    return Math.round(this.impressions * this.rate * 100) / 100;
  }

  copy(): GlobalComplaintCycle {
    return new GlobalComplaintCycle(
      this.code,
      this.name,
      this.impressions,
      this.rate,
      this.retries,
      this.journeyId,
      this.cost,
      this.durationMinutes,
      this.priority,
      this.attributes,
      this.visible,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a global complaint cycle in status idle. */
export function newGlobalComplaintCycle(code: string, name: string): GlobalComplaintCycle {
  return new GlobalComplaintCycle(code, name, 0, 0, 0, "", 0, 0, 0, new Map<string, string>(), false, "idle");
}
