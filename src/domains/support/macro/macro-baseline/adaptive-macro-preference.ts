import * as text from "../../../../kit/text.js";

/** Where a adaptive macro preference is in its life cycle. */
export type AdaptiveMacroPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A adaptive macro preference as the macro team keeps it. */
export class AdaptiveMacroPreference {
  code: string;
  name: string;
  summary: string;
  attempts: number;
  label: string;
  ratio: number;
  timezone: string;
  status: AdaptiveMacroPreferenceStatus;

  constructor(
    code: string,
    name: string,
    summary: string,
    attempts: number,
    label: string,
    ratio: number,
    timezone: string,
    status: AdaptiveMacroPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.summary = summary;
    this.attempts = attempts;
    this.label = label;
    this.ratio = ratio;
    this.timezone = timezone;
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

  canMoveTo(next: AdaptiveMacroPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: AdaptiveMacroPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive macro preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code}: ${this.name}`;
  }

  effectiveExposure(): number {
    return Math.round((this.attempts + this.ratio) * 100) / 100;
  }

  copy(): AdaptiveMacroPreference {
    return new AdaptiveMacroPreference(
      this.code,
      this.name,
      this.summary,
      this.attempts,
      this.label,
      this.ratio,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a adaptive macro preference in status planned. */
export function newAdaptiveMacroPreference(code: string, name: string): AdaptiveMacroPreference {
  return new AdaptiveMacroPreference(code, name, "", 0, "", 0, "", "planned");
}
