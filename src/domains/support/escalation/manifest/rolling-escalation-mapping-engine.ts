import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { RollingEscalationMapping } from "./rolling-escalation-mapping.js";

/** One step of the rolling escalation mapping calculation. */
export interface RollingEscalationMappingModifier {
  describe(): string;
  adjust(item: RollingEscalationMapping, value: number): number;
}

export class FlaggedRollingEscalationMappingAdjuster implements RollingEscalationMappingModifier {
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

  adjust(item: RollingEscalationMapping, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class CapRollingEscalationMappingAdjuster implements RollingEscalationMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: RollingEscalationMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class LabelRollingEscalationMappingAdjuster implements RollingEscalationMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by label";
  }

  adjust(item: RollingEscalationMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the rolling escalation mapping steps in order and keeps a trace of each. */
export class RollingEscalationMappingEngine {
  steps: RollingEscalationMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: RollingEscalationMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: RollingEscalationMapping): number {
    let current = item.netExposure();
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

  evaluateAll(items: RollingEscalationMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultRollingEscalationMappingEngine(flagsValue: flags.Registry): RollingEscalationMappingEngine {
  return new RollingEscalationMappingEngine(
    [
      new FlaggedRollingEscalationMappingAdjuster(flagsValue, "rolling-escalation-mapping-regional", -7.8),
      new CapRollingEscalationMappingAdjuster(21369),
      new LabelRollingEscalationMappingAdjuster(new Map<string, number>([["retail", 1.14]])),
    ],
    [],
    1.5,
    7629.3,
  );
}
