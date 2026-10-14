import * as text from "../../../../kit/text.js";

/** Where a seasonal reward cycle is in its life cycle. */
export type SeasonalRewardCycleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** The record of a seasonal reward cycle and its current status. */
export class SeasonalRewardCycle {
  code: string;
  name: string;
  graceDays: number;
  contactEmail: string;
  country: string;
  category: string;
  label: string;
  status: SeasonalRewardCycleStatus;

  constructor(
    code: string,
    name: string,
    graceDays: number,
    contactEmail: string,
    country: string,
    category: string,
    label: string,
    status: SeasonalRewardCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.graceDays = graceDays;
    this.contactEmail = contactEmail;
    this.country = country;
    this.category = category;
    this.label = label;
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

  canMoveTo(next: SeasonalRewardCycleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
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

  moveTo(next: SeasonalRewardCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal reward cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"seasonal reward cycle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.graceDays;
  }

  copy(): SeasonalRewardCycle {
    return new SeasonalRewardCycle(
      this.code,
      this.name,
      this.graceDays,
      this.contactEmail,
      this.country,
      this.category,
      this.label,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.country);
  }
}

/** Starts a seasonal reward cycle in status planned. */
export function newSeasonalRewardCycle(code: string, name: string): SeasonalRewardCycle {
  return new SeasonalRewardCycle(code, name, 0, "", "", "", "", "planned");
}
