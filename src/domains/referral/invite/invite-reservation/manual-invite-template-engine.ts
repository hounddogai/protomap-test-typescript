import * as flags from "../../../../kit/flags.js";
import { ManualInviteTemplate } from "./manual-invite-template.js";

/** One step of the manual invite template calculation. */
export interface ManualInviteTemplateAdjuster {
  describe(): string;
  adjust(item: ManualInviteTemplate, value: number): number;
}

export class ManualInviteTemplateEndsAtOffsetAdjuster implements ManualInviteTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus ends at times ${this.weight}`;
  }

  adjust(item: ManualInviteTemplate, value: number): number {
    return value + item.endsAt * this.weight;
  }
}

export class FlaggedManualInviteTemplateAdjuster implements ManualInviteTemplateAdjuster {
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

  adjust(item: ManualInviteTemplate, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumManualInviteTemplateAdjuster implements ManualInviteTemplateAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: ManualInviteTemplate, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class TieredManualInviteTemplateAdjuster implements ManualInviteTemplateAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ManualInviteTemplate, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

export class PercentManualInviteTemplateAdjuster implements ManualInviteTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ManualInviteTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

/** Runs the manual invite template steps in order and keeps a trace of each. */
export class ManualInviteTemplateEngine {
  steps: ManualInviteTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ManualInviteTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: ManualInviteTemplate): number {
    let current = item.measuredValue();
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

  evaluateAll(items: ManualInviteTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultManualInviteTemplateEngine(flagsValue: flags.Registry): ManualInviteTemplateEngine {
  return new ManualInviteTemplateEngine(
    [
      new ManualInviteTemplateEndsAtOffsetAdjuster(1.43),
      new FlaggedManualInviteTemplateAdjuster(flagsValue, "manual-invite-template-batched", 3.8),
      new MinimumManualInviteTemplateAdjuster(32.5),
      new TieredManualInviteTemplateAdjuster([1445, 3211, 4567, 9585], [0.99, 0.93, 1.1, 1.03]),
      new PercentManualInviteTemplateAdjuster(-17.1),
    ],
    [],
    1.6,
    67485.3,
  );
}
