import * as text from "../../../../kit/text.js";

/** Where a tiered window preference is in its life cycle. */
export type TieredWindowPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered window preference as the window team keeps it. */
export class TieredWindowPreference {
  code: string;
  label: string;
  active: boolean;
  reviewer: string;
  budget: number;
  startsAt: number;
  checksum: string;
  limit: number;
  status: TieredWindowPreferenceStatus;

  constructor(
    code: string,
    label: string,
    active: boolean,
    reviewer: string,
    budget: number,
    startsAt: number,
    checksum: string,
    limit: number,
    status: TieredWindowPreferenceStatus,
  ) {
    this.code = code;
    this.label = label;
    this.active = active;
    this.reviewer = reviewer;
    this.budget = budget;
    this.startsAt = startsAt;
    this.checksum = checksum;
    this.limit = limit;
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

  canMoveTo(next: TieredWindowPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "completed":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
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

  moveTo(next: TieredWindowPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered window preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} / ${this.label}`;
  }

  weightedVolume(): number {
    return Math.round((this.limit - this.budget) * 100) / 100;
  }

  copy(): TieredWindowPreference {
    return new TieredWindowPreference(
      this.code,
      this.label,
      this.active,
      this.reviewer,
      this.budget,
      this.startsAt,
      this.checksum,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a tiered window preference in status planned. */
export function newTieredWindowPreference(code: string, label: string): TieredWindowPreference {
  return new TieredWindowPreference(code, label, false, "", 0, 0, "", 0, "planned");
}
