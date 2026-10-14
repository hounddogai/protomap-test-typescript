import * as text from "../../../../kit/text.js";

/** Where a macro profile is in its life cycle. */
export type MacroProfileStatus = "requested" | "granted" | "revoked" | "expired";

/** A macro profile as the macro team keeps it. */
export class MacroProfile {
  code: string;
  label: string;
  timezone: string;
  budget: number;
  durationMinutes: number;
  windowDays: number;
  expiresAt: number;
  archived: boolean;
  impressions: number;
  status: MacroProfileStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    budget: number,
    durationMinutes: number,
    windowDays: number,
    expiresAt: number,
    archived: boolean,
    impressions: number,
    status: MacroProfileStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.budget = budget;
    this.durationMinutes = durationMinutes;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.archived = archived;
    this.impressions = impressions;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: MacroProfileStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "expired";
      case "granted":
        return next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MacroProfileStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro profile ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  projectedValue(): number {
    return Math.round((this.windowDays + this.durationMinutes) * 100) / 100;
  }

  copy(): MacroProfile {
    return new MacroProfile(
      this.code,
      this.label,
      this.timezone,
      this.budget,
      this.durationMinutes,
      this.windowDays,
      this.expiresAt,
      this.archived,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a macro profile in status requested. */
export function newMacroProfile(code: string, label: string): MacroProfile {
  return new MacroProfile(code, label, "", 0, 0, 0, 0, false, 0, "requested");
}
