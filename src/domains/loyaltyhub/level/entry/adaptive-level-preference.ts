import * as text from "../../../../kit/text.js";

/** Where a adaptive level preference is in its life cycle. */
export type AdaptiveLevelPreferenceStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A adaptive level preference as the level team keeps it. */
export class AdaptiveLevelPreference {
  code: string;
  name: string;
  title: string;
  rate: number;
  locale: string;
  version: number;
  description: string;
  margin: number;
  status: AdaptiveLevelPreferenceStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    rate: number,
    locale: string,
    version: number,
    description: string,
    margin: number,
    status: AdaptiveLevelPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.rate = rate;
    this.locale = locale;
    this.version = version;
    this.description = description;
    this.margin = margin;
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

  canMoveTo(next: AdaptiveLevelPreferenceStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "draining":
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

  moveTo(next: AdaptiveLevelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive level preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"adaptive level preference"} ${this.code}`;
  }

  effectiveExposure(): number {
    return Math.round((this.margin - this.version) * 100) / 100;
  }

  copy(): AdaptiveLevelPreference {
    return new AdaptiveLevelPreference(
      this.code,
      this.name,
      this.title,
      this.rate,
      this.locale,
      this.version,
      this.description,
      this.margin,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a adaptive level preference in status idle. */
export function newAdaptiveLevelPreference(code: string, name: string): AdaptiveLevelPreference {
  return new AdaptiveLevelPreference(code, name, "", 0, "", 0, "", 0, "idle");
}
