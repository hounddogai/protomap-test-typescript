import * as flags from "../../../../kit/flags.js";
import { LegacyEscalationException } from "./legacy-escalation-exception.js";

/** One step of the legacy escalation exception calculation. */
export interface LegacyEscalationExceptionModifier {
  describe(): string;
  adjust(item: LegacyEscalationException, value: number): number;
}

export class FlaggedLegacyEscalationExceptionAdjuster implements LegacyEscalationExceptionModifier {
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

  adjust(item: LegacyEscalationException, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentLegacyEscalationExceptionAdjuster implements LegacyEscalationExceptionModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyEscalationException, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class UtmSourceLegacyEscalationExceptionAdjuster implements LegacyEscalationExceptionModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by utm source";
  }

  adjust(item: LegacyEscalationException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the legacy escalation exception steps in order and keeps a trace of each. */
export class LegacyEscalationExceptionEngine {
  steps: LegacyEscalationExceptionModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyEscalationExceptionModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: LegacyEscalationException): number {
    let current = item.projectedTotal();
    this.trace = [];
    for (let index = 0; index < this.steps.length; index++) {
      const step = this.steps[index]!;
      const before = current;
      current = step.adjust(item, current);
      if (before !== current) {
        this.trace.push(`${index + 1}. ${step.describe()} changed ${before} to ${current}`);
      }
    }
    if (current < this.floor) return this.floor;
    if (current > this.ceiling) return this.ceiling;
    return current;
  }

  explain(): string {
    return this.trace.join("\n");
  }

  evaluateAll(items: LegacyEscalationException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultLegacyEscalationExceptionEngine(flagsValue: flags.Registry): LegacyEscalationExceptionEngine {
  return new LegacyEscalationExceptionEngine(
    [
      new FlaggedLegacyEscalationExceptionAdjuster(flagsValue, "legacy-escalation-exception-primary", 1.8),
      new PercentLegacyEscalationExceptionAdjuster(11.5),
      new UtmSourceLegacyEscalationExceptionAdjuster(
        new Map<string, number>([["north", 1.13], ["central", 1.08], ["east", 1.27]]),
      ),
    ],
    [],
    0.4,
    14193.3,
  );
}
