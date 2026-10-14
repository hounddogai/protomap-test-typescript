import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { JourneyNotice } from "./journey-notice.js";

/** One step of the journey notice calculation. */
export interface JourneyNoticeAdjuster {
  describe(): string;
  adjust(item: JourneyNotice, value: number): number;
}

export class RoundingJourneyNoticeAdjuster implements JourneyNoticeAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: JourneyNotice, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapJourneyNoticeAdjuster implements JourneyNoticeAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: JourneyNotice, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class MinimumJourneyNoticeAdjuster implements JourneyNoticeAdjuster {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: JourneyNotice, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class JourneyNoticeOpenRateOffsetAdjuster implements JourneyNoticeAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: JourneyNotice, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class FlaggedJourneyNoticeAdjuster implements JourneyNoticeAdjuster {
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

  adjust(item: JourneyNotice, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the journey notice steps in order and keeps a trace of each. */
export class JourneyNoticeEngine {
  steps: JourneyNoticeAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: JourneyNoticeAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: JourneyNotice): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: JourneyNotice[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultJourneyNoticeEngine(flagsValue: flags.Registry): JourneyNoticeEngine {
  return new JourneyNoticeEngine(
    [
      new RoundingJourneyNoticeAdjuster(5),
      new CapJourneyNoticeAdjuster(14285),
      new MinimumJourneyNoticeAdjuster(49.7),
      new JourneyNoticeOpenRateOffsetAdjuster(1.36),
      new FlaggedJourneyNoticeAdjuster(flagsValue, "journey-notice-default", -0.1),
    ],
    [],
    1.5,
    89830.2,
  );
}
