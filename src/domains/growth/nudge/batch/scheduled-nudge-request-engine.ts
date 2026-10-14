import * as numbers from "../../../../kit/numbers.js";
import { ScheduledNudgeRequest } from "./scheduled-nudge-request.js";

/** One step of the scheduled nudge request calculation. */
export interface ScheduledNudgeRequestModifier {
  describe(): string;
  adjust(item: ScheduledNudgeRequest, value: number): number;
}

export class RoundingScheduledNudgeRequestAdjuster implements ScheduledNudgeRequestModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ScheduledNudgeRequest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class PercentScheduledNudgeRequestAdjuster implements ScheduledNudgeRequestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: ScheduledNudgeRequest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class ScheduledNudgeRequestSendAtOffsetAdjuster implements ScheduledNudgeRequestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: ScheduledNudgeRequest, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

/** Runs the scheduled nudge request steps in order and keeps a trace of each. */
export class ScheduledNudgeRequestEngine {
  steps: ScheduledNudgeRequestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ScheduledNudgeRequestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ScheduledNudgeRequest): number {
    let current = item.weightedTotal();
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

  evaluateAll(items: ScheduledNudgeRequest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultScheduledNudgeRequestEngine(): ScheduledNudgeRequestEngine {
  return new ScheduledNudgeRequestEngine(
    [
      new RoundingScheduledNudgeRequestAdjuster(1),
      new PercentScheduledNudgeRequestAdjuster(-21.9),
      new ScheduledNudgeRequestSendAtOffsetAdjuster(1.5),
    ],
    [],
    3.5,
    92299.3,
  );
}
