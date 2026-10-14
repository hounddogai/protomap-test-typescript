import * as numbers from "../../../../kit/numbers.js";
import { ChallengeMapping } from "./challenge-mapping.js";

/** One step of the challenge mapping calculation. */
export interface ChallengeMappingModifier {
  describe(): string;
  adjust(item: ChallengeMapping, value: number): number;
}

export class RoundingChallengeMappingAdjuster implements ChallengeMappingModifier {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: ChallengeMapping, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class SourceChallengeMappingAdjuster implements ChallengeMappingModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by source";
  }

  adjust(item: ChallengeMapping, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class CapChallengeMappingAdjuster implements ChallengeMappingModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: ChallengeMapping, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class ChallengeMappingFloorValueOffsetAdjuster implements ChallengeMappingModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: ChallengeMapping, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

/** Runs the challenge mapping steps in order and keeps a trace of each. */
export class ChallengeMappingEngine {
  steps: ChallengeMappingModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: ChallengeMappingModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: ChallengeMapping): number {
    let current = item.projectedVolume();
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

  evaluateAll(items: ChallengeMapping[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultChallengeMappingEngine(): ChallengeMappingEngine {
  return new ChallengeMappingEngine(
    [
      new RoundingChallengeMappingAdjuster(0.25),
      new SourceChallengeMappingAdjuster(new Map<string, number>([["retail", 0.71]])),
      new CapChallengeMappingAdjuster(10045),
      new ChallengeMappingFloorValueOffsetAdjuster(1.2),
    ],
    [],
    1.2,
    35620,
  );
}
