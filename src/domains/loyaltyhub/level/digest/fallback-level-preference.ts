import * as text from "../../../../kit/text.js";

/** Where a fallback level preference is in its life cycle. */
export type FallbackLevelPreferenceStatus = "new" | "queued" | "running" | "done" | "failed";

/** One fallback level preference, with what the planners need to act on it. */
export class FallbackLevelPreference {
  code: string;
  label: string;
  category: string;
  locale: string;
  windowDays: number;
  expiresAt: number;
  priority: number;
  graceDays: number;
  conversionRate: number;
  ownerId: string;
  status: FallbackLevelPreferenceStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    locale: string,
    windowDays: number,
    expiresAt: number,
    priority: number,
    graceDays: number,
    conversionRate: number,
    ownerId: string,
    status: FallbackLevelPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.locale = locale;
    this.windowDays = windowDays;
    this.expiresAt = expiresAt;
    this.priority = priority;
    this.graceDays = graceDays;
    this.conversionRate = conversionRate;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackLevelPreferenceStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "queued":
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackLevelPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback level preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  weightedVolume(): number {
    return Math.round(this.windowDays * this.graceDays * 100) / 100;
  }

  copy(): FallbackLevelPreference {
    return new FallbackLevelPreference(
      this.code,
      this.label,
      this.category,
      this.locale,
      this.windowDays,
      this.expiresAt,
      this.priority,
      this.graceDays,
      this.conversionRate,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a fallback level preference in status new. */
export function newFallbackLevelPreference(code: string, label: string): FallbackLevelPreference {
  return new FallbackLevelPreference(code, label, "", "", 0, 0, 0, 0, 0, "", "new");
}
