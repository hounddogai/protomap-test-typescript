/**
 * The tiered touchpoint window records of attribution's touchpoint work, and the rules, stores, and
 * calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a tiered touchpoint window is in its life cycle. */
export type TieredTouchpointWindowStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One tiered touchpoint window, with what the planners need to act on it. */
export class TieredTouchpointWindow {
  code: string;
  label: string;
  version: number;
  source: string;
  threshold: number;
  locale: string;
  status: TieredTouchpointWindowStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    source: string,
    threshold: number,
    locale: string,
    status: TieredTouchpointWindowStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.source = source;
    this.threshold = threshold;
    this.locale = locale;
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

  canMoveTo(next: TieredTouchpointWindowStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "in_progress":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredTouchpointWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered touchpoint window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  projectedTotal(): number {
    return Math.round((this.version + this.threshold) * 100) / 100;
  }

  copy(): TieredTouchpointWindow {
    return new TieredTouchpointWindow(
      this.code,
      this.label,
      this.version,
      this.source,
      this.threshold,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a tiered touchpoint window in status planned. */
export function newTieredTouchpointWindow(code: string, label: string): TieredTouchpointWindow {
  return new TieredTouchpointWindow(code, label, 0, "", 0, "", "planned");
}
