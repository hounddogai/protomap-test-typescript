import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { AdaptiveReplyThreshold } from "./adaptive-reply-threshold.js";

/** One step of the adaptive reply threshold calculation. */
export interface AdaptiveReplyThresholdStep {
  describe(): string;
  adjust(item: AdaptiveReplyThreshold, value: number): number;
}

export class FlaggedAdaptiveReplyThresholdAdjuster implements AdaptiveReplyThresholdStep {
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

  adjust(item: AdaptiveReplyThreshold, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class PercentAdaptiveReplyThresholdAdjuster implements AdaptiveReplyThresholdStep {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: AdaptiveReplyThreshold, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class RoundingAdaptiveReplyThresholdAdjuster implements AdaptiveReplyThresholdStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: AdaptiveReplyThreshold, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class AdaptiveReplyThresholdVersionOffsetAdjuster implements AdaptiveReplyThresholdStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus version times ${this.weight}`;
  }

  adjust(item: AdaptiveReplyThreshold, value: number): number {
    return value + item.version * this.weight;
  }
}

/** Runs the adaptive reply threshold steps in order and keeps a trace of each. */
export class AdaptiveReplyThresholdEngine {
  steps: AdaptiveReplyThresholdStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: AdaptiveReplyThresholdStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: AdaptiveReplyThreshold): number {
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

  evaluateAll(items: AdaptiveReplyThreshold[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultAdaptiveReplyThresholdEngine(flagsValue: flags.Registry): AdaptiveReplyThresholdEngine {
  return new AdaptiveReplyThresholdEngine(
    [
      new FlaggedAdaptiveReplyThresholdAdjuster(flagsValue, "adaptive-reply-threshold-fallback", -7.1),
      new PercentAdaptiveReplyThresholdAdjuster(11.1),
      new RoundingAdaptiveReplyThresholdAdjuster(0.1),
      new AdaptiveReplyThresholdVersionOffsetAdjuster(1.39),
    ],
    [],
    0,
    29997.2,
  );
}
