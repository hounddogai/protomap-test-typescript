import * as numbers from "../../../../kit/numbers.js";
import { DefaultWarmupException } from "./default-warmup-exception.js";

/** One step of the default warmup exception calculation. */
export interface DefaultWarmupExceptionAdjuster {
  describe(): string;
  adjust(item: DefaultWarmupException, value: number): number;
}

export class RoundingDefaultWarmupExceptionAdjuster implements DefaultWarmupExceptionAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: DefaultWarmupException, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class DefaultWarmupExceptionDurationMinutesOffsetAdjuster implements DefaultWarmupExceptionAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus duration minutes times ${this.weight}`;
  }

  adjust(item: DefaultWarmupException, value: number): number {
    return value + item.durationMinutes * this.weight;
  }
}

export class ChannelDefaultWarmupExceptionAdjuster implements DefaultWarmupExceptionAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: DefaultWarmupException, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

/** Runs the default warmup exception steps in order and keeps a trace of each. */
export class DefaultWarmupExceptionEngine {
  steps: DefaultWarmupExceptionAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: DefaultWarmupExceptionAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  compute(item: DefaultWarmupException): number {
    let current = item.projectedExposure();
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

  evaluateAll(items: DefaultWarmupException[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.compute(item));
    }
    return results;
  }
}

export function defaultDefaultWarmupExceptionEngine(): DefaultWarmupExceptionEngine {
  return new DefaultWarmupExceptionEngine(
    [
      new RoundingDefaultWarmupExceptionAdjuster(1),
      new DefaultWarmupExceptionDurationMinutesOffsetAdjuster(0.43),
      new ChannelDefaultWarmupExceptionAdjuster(
        new Map<string, number>([["central", 0.71], ["north", 0.94], ["east", 0.95]]),
      ),
    ],
    [],
    3.5,
    38456.4,
  );
}
