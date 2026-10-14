import * as text from "../../../../kit/text.js";

/** Where a primary preference target is in its life cycle. */
export type PrimaryPreferenceTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A primary preference target as the preference team keeps it. */
export class PrimaryPreferenceTarget {
  code: string;
  title: string;
  maximum: number;
  frequencyCap: number;
  pinned: boolean;
  graceDays: number;
  status: PrimaryPreferenceTargetStatus;

  constructor(
    code: string,
    title: string,
    maximum: number,
    frequencyCap: number,
    pinned: boolean,
    graceDays: number,
    status: PrimaryPreferenceTargetStatus,
  ) {
    this.code = code;
    this.title = title;
    this.maximum = maximum;
    this.frequencyCap = frequencyCap;
    this.pinned = pinned;
    this.graceDays = graceDays;
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

  canMoveTo(next: PrimaryPreferenceTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: PrimaryPreferenceTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary preference target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  netVolume(): number {
    return Math.round(this.graceDays * this.maximum * 100) / 100;
  }

  copy(): PrimaryPreferenceTarget {
    return new PrimaryPreferenceTarget(
      this.code,
      this.title,
      this.maximum,
      this.frequencyCap,
      this.pinned,
      this.graceDays,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary preference target in status planned. */
export function newPrimaryPreferenceTarget(code: string, title: string): PrimaryPreferenceTarget {
  return new PrimaryPreferenceTarget(code, title, 0, 0, false, 0, "planned");
}
