/**
 * The scheduled frequency adjustment records of adops's frequency work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a scheduled frequency adjustment is in its life cycle. */
export type ScheduledFrequencyAdjustmentStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A scheduled frequency adjustment as the frequency team keeps it. */
export class ScheduledFrequencyAdjustment {
  code: string;
  name: string;
  updatedAt: number;
  retries: number;
  createdAt: number;
  channel: string;
  attributes: Map<string, string>;
  limit: number;
  openRate: number;
  status: ScheduledFrequencyAdjustmentStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    retries: number,
    createdAt: number,
    channel: string,
    attributes: Map<string, string>,
    limit: number,
    openRate: number,
    status: ScheduledFrequencyAdjustmentStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.retries = retries;
    this.createdAt = createdAt;
    this.channel = channel;
    this.attributes = attributes;
    this.limit = limit;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: ScheduledFrequencyAdjustmentStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ScheduledFrequencyAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`scheduled frequency adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  adjustedTotal(): number {
    return Math.round((this.limit + this.updatedAt) * 100) / 100;
  }

  copy(): ScheduledFrequencyAdjustment {
    return new ScheduledFrequencyAdjustment(
      this.code,
      this.name,
      this.updatedAt,
      this.retries,
      this.createdAt,
      this.channel,
      this.attributes,
      this.limit,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a scheduled frequency adjustment in status open. */
export function newScheduledFrequencyAdjustment(code: string, name: string): ScheduledFrequencyAdjustment {
  return new ScheduledFrequencyAdjustment(code, name, 0, 0, 0, "", new Map<string, string>(), 0, 0, "open");
}
