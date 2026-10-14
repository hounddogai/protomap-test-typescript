import * as text from "../../../../kit/text.js";

/** Where a placement milestone is in its life cycle. */
export type PlacementMilestoneStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One placement milestone, with what the planners need to act on it. */
export class PlacementMilestone {
  code: string;
  name: string;
  title: string;
  durationMinutes: number;
  attempts: number;
  locale: string;
  minimum: number;
  graceDays: number;
  country: string;
  ownerId: string;
  status: PlacementMilestoneStatus;

  constructor(
    code: string,
    name: string,
    title: string,
    durationMinutes: number,
    attempts: number,
    locale: string,
    minimum: number,
    graceDays: number,
    country: string,
    ownerId: string,
    status: PlacementMilestoneStatus,
  ) {
    this.code = code;
    this.name = name;
    this.title = title;
    this.durationMinutes = durationMinutes;
    this.attempts = attempts;
    this.locale = locale;
    this.minimum = minimum;
    this.graceDays = graceDays;
    this.country = country;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PlacementMilestoneStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        return next === "withdrawn";
    }
    return false;
  }

  moveTo(next: PlacementMilestoneStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`placement milestone ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"placement milestone"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round(this.minimum * this.attempts * 100) / 100;
  }

  copy(): PlacementMilestone {
    return new PlacementMilestone(
      this.code,
      this.name,
      this.title,
      this.durationMinutes,
      this.attempts,
      this.locale,
      this.minimum,
      this.graceDays,
      this.country,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a placement milestone in status proposed. */
export function newPlacementMilestone(code: string, name: string): PlacementMilestone {
  return new PlacementMilestone(code, name, "", 0, 0, "", 0, 0, "", "", "proposed");
}
