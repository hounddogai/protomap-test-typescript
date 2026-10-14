/**
 * The csat preference records of support's csat work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a csat preference is in its life cycle. */
export type CsatPreferenceStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One csat preference, with what the planners need to act on it. */
export class CsatPreference {
  code: string;
  label: string;
  channel: string;
  source: string;
  quantity: number;
  capacity: number;
  timezone: string;
  status: CsatPreferenceStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    source: string,
    quantity: number,
    capacity: number,
    timezone: string,
    status: CsatPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.source = source;
    this.quantity = quantity;
    this.capacity = capacity;
    this.timezone = timezone;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CsatPreferenceStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
          case "suspended":
            return true;
        }
        return false;
      case "pending":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: CsatPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`csat preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"csat preference"} ${this.code}`;
  }

  adjustedVolume(): number {
    return Math.round((this.capacity - this.quantity) * 100) / 100;
  }

  copy(): CsatPreference {
    return new CsatPreference(
      this.code,
      this.label,
      this.channel,
      this.source,
      this.quantity,
      this.capacity,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a csat preference in status draft. */
export function newCsatPreference(code: string, label: string): CsatPreference {
  return new CsatPreference(code, label, "", "", 0, 0, "", "draft");
}
