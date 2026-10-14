import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { ManualTicketViewAssignment } from "./manual-ticket-view-assignment.js";

/** One step of the manual ticket view assignment calculation. */
export interface ManualTicketViewAssignmentStep {
  describe(): string;
  adjust(item: ManualTicketViewAssignment, value: number): number;
}

export class TitleManualTicketViewAssignmentAdjuster implements ManualTicketViewAssignmentStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by title";
  }

  adjust(item: ManualTicketViewAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class PercentManualTicketViewAssignmentAdjuster implements ManualTicketViewAssignmentStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualTicketViewAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedManualTicketViewAssignmentAdjuster implements ManualTicketViewAssignmentStep {
  flags: flags.Registry;
  flag: string;
  percent: number;

  constructor(flagsValue: flags.Registry, flag: string, percent: number) {
    this.flags = flagsValue;
    this.flag = flag;
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent} when ${this.flag} is on`;
  }

  adjust(item: ManualTicketViewAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual ticket view assignment steps in order and keeps a trace of each. */
export class ManualTicketViewAssignmentEngine {
  steps: ManualTicketViewAssignmentStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualTicketViewAssignmentStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualTicketViewAssignment): number {
    let current = item.effectiveVolume();
    this.trace = [];
    for (const step of this.steps) {
      const next = step.adjust(item, current);
      this.trace.push(`${step.describe()}: ${Math.round(current * 100) / 100} -> ${Math.round(next * 100) / 100}`);
      current = next;
    }
    return numbers.clampFloat(current, this.floor, this.ceiling);
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: ManualTicketViewAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualTicketViewAssignmentEngine(flagsValue: flags.Registry): ManualTicketViewAssignmentEngine {
  return new ManualTicketViewAssignmentEngine(
    [
      new TitleManualTicketViewAssignmentAdjuster(new Map<string, number>([["north", 0.95]])),
      new PercentManualTicketViewAssignmentAdjuster(19.7),
      new FlaggedManualTicketViewAssignmentAdjuster(flagsValue, "manual-ticket-view-assignment-default", -9.5),
    ],
    [],
    3.3,
    55719.9,
  );
}
