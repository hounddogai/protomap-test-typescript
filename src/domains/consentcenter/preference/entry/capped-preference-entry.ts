import * as text from "../../../../kit/text.js";

/** Where a capped preference entry is in its life cycle. */
export type CappedPreferenceEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One capped preference entry, with what the planners need to act on it. */
export class CappedPreferenceEntry {
  code: string;
  label: string;
  pinned: boolean;
  checksum: string;
  revision: number;
  timezone: string;
  startsAt: number;
  graceDays: number;
  status: CappedPreferenceEntryStatus;

  constructor(
    code: string,
    label: string,
    pinned: boolean,
    checksum: string,
    revision: number,
    timezone: string,
    startsAt: number,
    graceDays: number,
    status: CappedPreferenceEntryStatus,
  ) {
    this.code = code;
    this.label = label;
    this.pinned = pinned;
    this.checksum = checksum;
    this.revision = revision;
    this.timezone = timezone;
    this.startsAt = startsAt;
    this.graceDays = graceDays;
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

  canMoveTo(next: CappedPreferenceEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "warming" || next === "stopped";
      case "warming":
        return next === "stopped";
      case "ready":
        return next === "stopped";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: CappedPreferenceEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped preference entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedLoad(): number {
    return Math.round(this.graceDays * this.revision * 100) / 100;
  }

  copy(): CappedPreferenceEntry {
    return new CappedPreferenceEntry(
      this.code,
      this.label,
      this.pinned,
      this.checksum,
      this.revision,
      this.timezone,
      this.startsAt,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a capped preference entry in status idle. */
export function newCappedPreferenceEntry(code: string, label: string): CappedPreferenceEntry {
  return new CappedPreferenceEntry(code, label, false, "", 0, "", 0, 0, "idle");
}
