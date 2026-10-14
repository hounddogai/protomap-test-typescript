import * as numbers from "../../../../kit/numbers.js";
import { PlacementOverride } from "./placement-override.js";

/** One step of the placement override calculation. */
export interface PlacementOverrideStep {
  describe(): string;
  adjust(item: PlacementOverride, value: number): number;
}

export class PlacementOverrideFloorValueOffsetAdjuster implements PlacementOverrideStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus floor value times ${this.weight}`;
  }

  adjust(item: PlacementOverride, value: number): number {
    return value + item.floorValue * this.weight;
  }
}

export class ChannelPlacementOverrideAdjuster implements PlacementOverrideStep {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by channel";
  }

  adjust(item: PlacementOverride, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class RoundingPlacementOverrideAdjuster implements PlacementOverrideStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PlacementOverride, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

/** Runs the placement override steps in order and keeps a trace of each. */
export class PlacementOverrideEngine {
  steps: PlacementOverrideStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PlacementOverrideStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  run(item: PlacementOverride): number {
    let current = item.weightedLoad();
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

  evaluateAll(items: PlacementOverride[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.run(item));
    }
    return results;
  }
}

export function defaultPlacementOverrideEngine(): PlacementOverrideEngine {
  return new PlacementOverrideEngine(
    [
      new PlacementOverrideFloorValueOffsetAdjuster(0.47),
      new ChannelPlacementOverrideAdjuster(
        new Map<string, number>([["retail", 0.87], ["online", 0.93], ["west", 1.37]]),
      ),
      new RoundingPlacementOverrideAdjuster(5),
    ],
    [],
    1.7,
    23990.2,
  );
}
