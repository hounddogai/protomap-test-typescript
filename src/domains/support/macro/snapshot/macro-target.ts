import * as text from "../../../../kit/text.js";

/** Where a macro target is in its life cycle. */
export type MacroTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** One macro target, with what the planners need to act on it. */
export class MacroTarget {
  code: string;
  name: string;
  cost: number;
  maximum: number;
  budget: number;
  journeyId: string;
  region: string;
  description: string;
  windowDays: number;
  unit: string;
  source: string;
  status: MacroTargetStatus;

  constructor(
    code: string,
    name: string,
    cost: number,
    maximum: number,
    budget: number,
    journeyId: string,
    region: string,
    description: string,
    windowDays: number,
    unit: string,
    source: string,
    status: MacroTargetStatus,
  ) {
    this.code = code;
    this.name = name;
    this.cost = cost;
    this.maximum = maximum;
    this.budget = budget;
    this.journeyId = journeyId;
    this.region = region;
    this.description = description;
    this.windowDays = windowDays;
    this.unit = unit;
    this.source = source;
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

  canMoveTo(next: MacroTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "cancelled";
      case "scheduled":
        switch (next) {
          case "in_progress":
          case "cancelled":
            return true;
        }
        return false;
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

  moveTo(next: MacroTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`macro target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"macro target"} ${this.code}`;
  }

  effectiveVolume(): number {
    return Math.round((this.budget + this.cost) * 100) / 100;
  }

  copy(): MacroTarget {
    return new MacroTarget(
      this.code,
      this.name,
      this.cost,
      this.maximum,
      this.budget,
      this.journeyId,
      this.region,
      this.description,
      this.windowDays,
      this.unit,
      this.source,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a macro target in status planned. */
export function newMacroTarget(code: string, name: string): MacroTarget {
  return new MacroTarget(code, name, 0, 0, 0, "", "", "", 0, "", "", "planned");
}
