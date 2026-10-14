/**
 * The global complaint override records of deliverability's complaint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a global complaint override is in its life cycle. */
export type GlobalComplaintOverrideStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A global complaint override. Its code is unique within a tenant. */
export class GlobalComplaintOverride {
  code: string;
  title: string;
  unit: string;
  sequence: number;
  channel: string;
  openRate: number;
  timezone: string;
  capacity: number;
  frequencyCap: number;
  variant: string;
  minimum: number;
  status: GlobalComplaintOverrideStatus;

  constructor(
    code: string,
    title: string,
    unit: string,
    sequence: number,
    channel: string,
    openRate: number,
    timezone: string,
    capacity: number,
    frequencyCap: number,
    variant: string,
    minimum: number,
    status: GlobalComplaintOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.unit = unit;
    this.sequence = sequence;
    this.channel = channel;
    this.openRate = openRate;
    this.timezone = timezone;
    this.capacity = capacity;
    this.frequencyCap = frequencyCap;
    this.variant = variant;
    this.minimum = minimum;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalComplaintOverrideStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalComplaintOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global complaint override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  effectiveTotal(): number {
    return Math.round((this.minimum + this.sequence) * 100) / 100;
  }

  copy(): GlobalComplaintOverride {
    return new GlobalComplaintOverride(
      this.code,
      this.title,
      this.unit,
      this.sequence,
      this.channel,
      this.openRate,
      this.timezone,
      this.capacity,
      this.frequencyCap,
      this.variant,
      this.minimum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global complaint override in status planned. */
export function newGlobalComplaintOverride(code: string, title: string): GlobalComplaintOverride {
  return new GlobalComplaintOverride(code, title, "", 0, "", 0, "", 0, 0, "", 0, "planned");
}
