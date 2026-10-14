import * as text from "../../../../kit/text.js";

/** Where a seasonal placement preference is in its life cycle. */
export type SeasonalPlacementPreferenceStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal placement preference. Its code is unique within a tenant. */
export class SeasonalPlacementPreference {
  code: string;
  title: string;
  rate: number;
  description: string;
  priority: number;
  checksum: string;
  externalRef: string;
  status: SeasonalPlacementPreferenceStatus;

  constructor(
    code: string,
    title: string,
    rate: number,
    description: string,
    priority: number,
    checksum: string,
    externalRef: string,
    status: SeasonalPlacementPreferenceStatus,
  ) {
    this.code = code;
    this.title = title;
    this.rate = rate;
    this.description = description;
    this.priority = priority;
    this.checksum = checksum;
    this.externalRef = externalRef;
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

  canMoveTo(next: SeasonalPlacementPreferenceStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "in_progress" || next === "completed";
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SeasonalPlacementPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal placement preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"seasonal placement preference"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.priority - this.rate) * 100) / 100;
  }

  copy(): SeasonalPlacementPreference {
    return new SeasonalPlacementPreference(
      this.code,
      this.title,
      this.rate,
      this.description,
      this.priority,
      this.checksum,
      this.externalRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal placement preference in status planned. */
export function newSeasonalPlacementPreference(code: string, title: string): SeasonalPlacementPreference {
  return new SeasonalPlacementPreference(code, title, 0, "", 0, "", "", "planned");
}
