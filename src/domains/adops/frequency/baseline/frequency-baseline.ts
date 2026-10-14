/**
 * The frequency baseline records of adops's frequency work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a frequency baseline is in its life cycle. */
export type FrequencyBaselineStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A frequency baseline. Its code is unique within a tenant. */
export class FrequencyBaseline {
  code: string;
  name: string;
  attributes: Map<string, string>;
  approved: boolean;
  graceDays: number;
  maximum: number;
  retries: number;
  status: FrequencyBaselineStatus;

  constructor(
    code: string,
    name: string,
    attributes: Map<string, string>,
    approved: boolean,
    graceDays: number,
    maximum: number,
    retries: number,
    status: FrequencyBaselineStatus,
  ) {
    this.code = code;
    this.name = name;
    this.attributes = attributes;
    this.approved = approved;
    this.graceDays = graceDays;
    this.maximum = maximum;
    this.retries = retries;
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

  canMoveTo(next: FrequencyBaselineStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "draining";
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: FrequencyBaselineStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`frequency baseline ${this.code} cannot move from ${this.status} to ${next}`);
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

  adjustedValue(): number {
    return Math.round(this.maximum * this.graceDays * 100) / 100;
  }

  copy(): FrequencyBaseline {
    return new FrequencyBaseline(
      this.code,
      this.name,
      this.attributes,
      this.approved,
      this.graceDays,
      this.maximum,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a frequency baseline in status idle. */
export function newFrequencyBaseline(code: string, name: string): FrequencyBaseline {
  return new FrequencyBaseline(code, name, new Map<string, string>(), false, 0, 0, 0, "idle");
}
