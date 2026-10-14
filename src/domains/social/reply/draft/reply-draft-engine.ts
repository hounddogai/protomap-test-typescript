import * as numbers from "../../../../kit/numbers.js";
import { ReplyDraft } from "./reply-draft.js";

/** One step of the reply draft calculation. */
export interface ReplyDraftAdjuster {
  describe(): string;
  adjust(item: ReplyDraft, value: number): number;
}

export class ChannelReplyDraftAdjuster implements ReplyDraftAdjuster {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: ReplyDraft, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingReplyDraftAdjuster implements ReplyDraftAdjuster {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ReplyDraft, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class TieredReplyDraftAdjuster implements ReplyDraftAdjuster {
  bounds: number[];
  rates: number[];

  constructor(bounds: number[], rates: number[]) {
    this.bounds = bounds;
    this.rates = rates;
  }

  describe(): string {
    return `${this.bounds.length} tiers`;
  }

  adjust(item: ReplyDraft, value: number): number {
    for (let index = 0; index < this.bounds.length; index++) {
      if (value <= this.bounds[index]! && index < this.rates.length) return value * this.rates[index]!;
    }
    return value;
  }
}

/** Runs the reply draft steps in order and keeps a trace of each. */
export class ReplyDraftEngine {
  steps: ReplyDraftAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ReplyDraftAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: ReplyDraft): number {
    let current = item.netLoad();
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

  evaluateAll(items: ReplyDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultReplyDraftEngine(): ReplyDraftEngine {
  return new ReplyDraftEngine(
    [
      new ChannelReplyDraftAdjuster(
        new Map<string, number>([["south", 0.96], ["retail", 0.72], ["east", 0.87]]),
      ),
      new RoundingReplyDraftAdjuster(0.25),
      new TieredReplyDraftAdjuster([3422, 7955], [0.87, 0.98]),
    ],
    [],
    1.7,
    28033.7,
  );
}
