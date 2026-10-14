import * as text from "../../../../kit/text.js";

/** Where a pending streak bundle is in its life cycle. */
export type PendingStreakBundleStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** One pending streak bundle, with what the planners need to act on it. */
export class PendingStreakBundle {
  code: string;
  label: string;
  capacity: number;
  maximum: number;
  locale: string;
  status: PendingStreakBundleStatus;

  constructor(
    code: string,
    label: string,
    capacity: number,
    maximum: number,
    locale: string,
    status: PendingStreakBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.capacity = capacity;
    this.maximum = maximum;
    this.locale = locale;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingStreakBundleStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        switch (next) {
          case "suspended":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingStreakBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending streak bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"pending streak bundle"} ${this.code}`;
  }

  weightedLoad(): number {
    return Math.round((this.maximum + this.capacity) * 100) / 100;
  }

  copy(): PendingStreakBundle {
    return new PendingStreakBundle(this.code, this.label, this.capacity, this.maximum, this.locale, this.status);
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a pending streak bundle in status draft. */
export function newPendingStreakBundle(code: string, label: string): PendingStreakBundle {
  return new PendingStreakBundle(code, label, 0, 0, "", "draft");
}
