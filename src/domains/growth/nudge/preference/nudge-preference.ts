/**
 * The nudge preference records of growth's nudge work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a nudge preference is in its life cycle. */
export type NudgePreferenceStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One nudge preference, with what the planners need to act on it. */
export class NudgePreference {
  code: string;
  name: string;
  amount: number;
  windowDays: number;
  locale: string;
  utmSource: string;
  openRate: number;
  channel: string;
  notes: string;
  ceiling: number;
  floorValue: number;
  status: NudgePreferenceStatus;

  constructor(
    code: string,
    name: string,
    amount: number,
    windowDays: number,
    locale: string,
    utmSource: string,
    openRate: number,
    channel: string,
    notes: string,
    ceiling: number,
    floorValue: number,
    status: NudgePreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.amount = amount;
    this.windowDays = windowDays;
    this.locale = locale;
    this.utmSource = utmSource;
    this.openRate = openRate;
    this.channel = channel;
    this.notes = notes;
    this.ceiling = ceiling;
    this.floorValue = floorValue;
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

  canMoveTo(next: NudgePreferenceStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved" || next === "archived";
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: NudgePreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`nudge preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  netLoad(): number {
    return Math.round((this.floorValue + this.windowDays) * 100) / 100;
  }

  copy(): NudgePreference {
    return new NudgePreference(
      this.code,
      this.name,
      this.amount,
      this.windowDays,
      this.locale,
      this.utmSource,
      this.openRate,
      this.channel,
      this.notes,
      this.ceiling,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a nudge preference in status open. */
export function newNudgePreference(code: string, name: string): NudgePreference {
  return new NudgePreference(code, name, 0, 0, "", "", 0, "", "", 0, 0, "open");
}
