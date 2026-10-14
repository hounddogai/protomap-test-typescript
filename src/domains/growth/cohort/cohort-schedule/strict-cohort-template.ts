import * as text from "../../../../kit/text.js";

/** Where a strict cohort template is in its life cycle. */
export type StrictCohortTemplateStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A strict cohort template as the cohort team keeps it. */
export class StrictCohortTemplate {
  code: string;
  name: string;
  visible: boolean;
  title: string;
  floorValue: number;
  budget: number;
  status: StrictCohortTemplateStatus;

  constructor(
    code: string,
    name: string,
    visible: boolean,
    title: string,
    floorValue: number,
    budget: number,
    status: StrictCohortTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.visible = visible;
    this.title = title;
    this.floorValue = floorValue;
    this.budget = budget;
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

  canMoveTo(next: StrictCohortTemplateStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
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

  moveTo(next: StrictCohortTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`strict cohort template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  weightedLoad(): number {
    return Math.round((this.budget - this.floorValue) * 100) / 100;
  }

  copy(): StrictCohortTemplate {
    return new StrictCohortTemplate(
      this.code,
      this.name,
      this.visible,
      this.title,
      this.floorValue,
      this.budget,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a strict cohort template in status planned. */
export function newStrictCohortTemplate(code: string, name: string): StrictCohortTemplate {
  return new StrictCohortTemplate(code, name, false, "", 0, 0, "planned");
}
