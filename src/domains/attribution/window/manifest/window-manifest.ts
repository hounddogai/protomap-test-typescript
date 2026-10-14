/**
 * The window manifest records of attribution's window work, and the rules, stores, and calculations around
 * them.
 */

import * as text from "../../../../kit/text.js";

/** Where a window manifest is in its life cycle. */
export type WindowManifestStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** The record of a window manifest and its current status. */
export class WindowManifest {
  code: string;
  title: string;
  durationMinutes: number;
  timezone: string;
  locale: string;
  category: string;
  cohort: string;
  batchSize: number;
  status: WindowManifestStatus;

  constructor(
    code: string,
    title: string,
    durationMinutes: number,
    timezone: string,
    locale: string,
    category: string,
    cohort: string,
    batchSize: number,
    status: WindowManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.timezone = timezone;
    this.locale = locale;
    this.category = category;
    this.cohort = cohort;
    this.batchSize = batchSize;
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

  canMoveTo(next: WindowManifestStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "in_review":
        return next === "archived";
      case "resolved":
        return next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} (${this.title})`;
  }

  projectedValue(): number {
    return Math.round(this.batchSize * this.durationMinutes * 100) / 100;
  }

  copy(): WindowManifest {
    return new WindowManifest(
      this.code,
      this.title,
      this.durationMinutes,
      this.timezone,
      this.locale,
      this.category,
      this.cohort,
      this.batchSize,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a window manifest in status open. */
export function newWindowManifest(code: string, title: string): WindowManifest {
  return new WindowManifest(code, title, 0, "", "", "", "", 0, "open");
}
