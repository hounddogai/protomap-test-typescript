/**
 * The capped preference override records of consentcenter's preference work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a capped preference override is in its life cycle. */
export type CappedPreferenceOverrideStatus = "created" | "validated" | "published" | "retired";

/** The record of a capped preference override and its current status. */
export class CappedPreferenceOverride {
  code: string;
  title: string;
  version: number;
  updatedAt: number;
  segment: string;
  pinned: boolean;
  ceiling: number;
  channel: string;
  status: CappedPreferenceOverrideStatus;

  constructor(
    code: string,
    title: string,
    version: number,
    updatedAt: number,
    segment: string,
    pinned: boolean,
    ceiling: number,
    channel: string,
    status: CappedPreferenceOverrideStatus,
  ) {
    this.code = code;
    this.title = title;
    this.version = version;
    this.updatedAt = updatedAt;
    this.segment = segment;
    this.pinned = pinned;
    this.ceiling = ceiling;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CappedPreferenceOverrideStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "retired";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedPreferenceOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped preference override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
    this.version += 1;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  adjustedValue(): number {
    return Math.round(this.updatedAt * this.version * 100) / 100;
  }

  copy(): CappedPreferenceOverride {
    return new CappedPreferenceOverride(
      this.code,
      this.title,
      this.version,
      this.updatedAt,
      this.segment,
      this.pinned,
      this.ceiling,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a capped preference override in status created. */
export function newCappedPreferenceOverride(code: string, title: string): CappedPreferenceOverride {
  return new CappedPreferenceOverride(code, title, 0, 0, "", false, 0, "", "created");
}
