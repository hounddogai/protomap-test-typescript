import * as text from "../../../../kit/text.js";

/** Where a lenient preference window is in its life cycle. */
export type LenientPreferenceWindowStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a lenient preference window and its current status. */
export class LenientPreferenceWindow {
  code: string;
  label: string;
  utmSource: string;
  title: string;
  endsAt: number;
  floorValue: number;
  audienceId: string;
  checksum: string;
  currency: string;
  status: LenientPreferenceWindowStatus;

  constructor(
    code: string,
    label: string,
    utmSource: string,
    title: string,
    endsAt: number,
    floorValue: number,
    audienceId: string,
    checksum: string,
    currency: string,
    status: LenientPreferenceWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.utmSource = utmSource;
    this.title = title;
    this.endsAt = endsAt;
    this.floorValue = floorValue;
    this.audienceId = audienceId;
    this.checksum = checksum;
    this.currency = currency;
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

  canMoveTo(next: LenientPreferenceWindowStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "draining" || next === "stopped";
      case "warming":
        switch (next) {
          case "ready":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LenientPreferenceWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient preference window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  projectedLoad(): number {
    return Math.round((this.floorValue - this.endsAt) * 100) / 100;
  }

  copy(): LenientPreferenceWindow {
    return new LenientPreferenceWindow(
      this.code,
      this.label,
      this.utmSource,
      this.title,
      this.endsAt,
      this.floorValue,
      this.audienceId,
      this.checksum,
      this.currency,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a lenient preference window in status idle. */
export function newLenientPreferenceWindow(code: string, label: string): LenientPreferenceWindow {
  return new LenientPreferenceWindow(code, label, "", "", 0, 0, "", "", "", "idle");
}
