import * as text from "../../../../kit/text.js";

/** Where a fallback preference entry is in its life cycle. */
export type FallbackPreferenceEntryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One fallback preference entry, with what the planners need to act on it. */
export class FallbackPreferenceEntry {
  code: string;
  title: string;
  openRate: number;
  timezone: string;
  endsAt: number;
  expiresAt: number;
  status: FallbackPreferenceEntryStatus;

  constructor(
    code: string,
    title: string,
    openRate: number,
    timezone: string,
    endsAt: number,
    expiresAt: number,
    status: FallbackPreferenceEntryStatus,
  ) {
    this.code = code;
    this.title = title;
    this.openRate = openRate;
    this.timezone = timezone;
    this.endsAt = endsAt;
    this.expiresAt = expiresAt;
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

  canMoveTo(next: FallbackPreferenceEntryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "stopped";
      case "warming":
        switch (next) {
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

  moveTo(next: FallbackPreferenceEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback preference entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"fallback preference entry"} ${this.code}`;
  }

  effectiveLoad(): number {
    return Math.round(this.endsAt * this.expiresAt * 100) / 100;
  }

  copy(): FallbackPreferenceEntry {
    return new FallbackPreferenceEntry(
      this.code,
      this.title,
      this.openRate,
      this.timezone,
      this.endsAt,
      this.expiresAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a fallback preference entry in status idle. */
export function newFallbackPreferenceEntry(code: string, title: string): FallbackPreferenceEntry {
  return new FallbackPreferenceEntry(code, title, 0, "", 0, 0, "idle");
}
