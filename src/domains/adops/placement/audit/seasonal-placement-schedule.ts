import * as text from "../../../../kit/text.js";

/** Where a seasonal placement schedule is in its life cycle. */
export type SeasonalPlacementScheduleStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A seasonal placement schedule as the placement team keeps it. */
export class SeasonalPlacementSchedule {
  code: string;
  title: string;
  revision: number;
  phone: string;
  visible: boolean;
  description: string;
  version: number;
  status: SeasonalPlacementScheduleStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    phone: string,
    visible: boolean,
    description: string,
    version: number,
    status: SeasonalPlacementScheduleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.phone = phone;
    this.visible = visible;
    this.description = description;
    this.version = version;
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

  canMoveTo(next: SeasonalPlacementScheduleStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        switch (next) {
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

  moveTo(next: SeasonalPlacementScheduleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal placement schedule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  effectiveLoad(): number {
    return Math.round((this.version - this.revision) * 100) / 100;
  }

  copy(): SeasonalPlacementSchedule {
    return new SeasonalPlacementSchedule(
      this.code,
      this.title,
      this.revision,
      this.phone,
      this.visible,
      this.description,
      this.version,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a seasonal placement schedule in status planned. */
export function newSeasonalPlacementSchedule(code: string, title: string): SeasonalPlacementSchedule {
  return new SeasonalPlacementSchedule(code, title, 0, "", false, "", 0, "planned");
}
