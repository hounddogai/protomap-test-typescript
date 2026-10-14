/**
 * The scheduled touchpoint quota records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled touchpoint quota is in its life cycle. */
export type ScheduledTouchpointQuotaStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a scheduled touchpoint quota and its current status. */
export class ScheduledTouchpointQuota {
  code: string;
  label: string;
  graceDays: number;
  minimum: number;
  weight: number;
  priority: number;
  name: string;
  phone: string;
  status: ScheduledTouchpointQuotaStatus;

  constructor(
    code: string,
    label: string,
    graceDays: number,
    minimum: number,
    weight: number,
    priority: number,
    name: string,
    phone: string,
    status: ScheduledTouchpointQuotaStatus,
  ) {
    this.code = code;
    this.label = label;
    this.graceDays = graceDays;
    this.minimum = minimum;
    this.weight = weight;
    this.priority = priority;
    this.name = name;
    this.phone = phone;
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

  canMoveTo(next: ScheduledTouchpointQuotaStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        return next === "ready";
      case "ready":
        switch (next) {
          case "draining":
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

  moveTo(next: ScheduledTouchpointQuotaStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled touchpoint quota ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  adjustedLoad(): number {
    return Math.round((this.weight - this.priority) * 100) / 100;
  }

  copy(): ScheduledTouchpointQuota {
    return new ScheduledTouchpointQuota(
      this.code,
      this.label,
      this.graceDays,
      this.minimum,
      this.weight,
      this.priority,
      this.name,
      this.phone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a scheduled touchpoint quota in status idle. */
export function newScheduledTouchpointQuota(code: string, label: string): ScheduledTouchpointQuota {
  return new ScheduledTouchpointQuota(code, label, 0, 0, 0, 0, "", "", "idle");
}
