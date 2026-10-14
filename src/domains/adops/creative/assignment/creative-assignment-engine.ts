import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { CreativeAssignment } from "./creative-assignment.js";

/** One step of the creative assignment calculation. */
export interface CreativeAssignmentModifier {
  describe(): string;
  adjust(item: CreativeAssignment, value: number): number;
}

export class FlaggedCreativeAssignmentAdjuster implements CreativeAssignmentModifier {
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

  adjust(item: CreativeAssignment, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumCreativeAssignmentAdjuster implements CreativeAssignmentModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: CreativeAssignment, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class PercentCreativeAssignmentAdjuster implements CreativeAssignmentModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: CreativeAssignment, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class NameCreativeAssignmentAdjuster implements CreativeAssignmentModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by name";
  }

  adjust(item: CreativeAssignment, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class TieredCreativeAssignmentAdjuster implements CreativeAssignmentModifier {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: CreativeAssignment, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the creative assignment steps in order and keeps a trace of each. */
export class CreativeAssignmentEngine {
  steps: CreativeAssignmentModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: CreativeAssignmentModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: CreativeAssignment): number {
    let current = item.adjustedLoad();
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

  evaluateAll(items: CreativeAssignment[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultCreativeAssignmentEngine(flagsValue: flags.Registry): CreativeAssignmentEngine {
  return new CreativeAssignmentEngine(
    [
      new FlaggedCreativeAssignmentAdjuster(flagsValue, "creative-assignment-global", -0.3),
      new MinimumCreativeAssignmentAdjuster(47.6),
      new PercentCreativeAssignmentAdjuster(13.4),
      new NameCreativeAssignmentAdjuster(new Map<string, number>([["east", 1.05], ["online", 0.97]])),
      new TieredCreativeAssignmentAdjuster([670, 6555, 8207], [1.03, 0.96, 1.13]),
    ],
    [],
    1.1,
    10484.1,
  );
}
