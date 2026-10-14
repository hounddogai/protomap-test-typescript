import * as numbers from "../../../../kit/numbers.js";
import { PrimaryPaywallTemplate } from "./primary-paywall-template.js";

/** One step of the primary paywall template calculation. */
export interface PrimaryPaywallTemplateAdjuster {
  describe(): string;
  adjust(item: PrimaryPaywallTemplate, value: number): number;
}

export class CapPrimaryPaywallTemplateAdjuster implements PrimaryPaywallTemplateAdjuster {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryPaywallTemplate, value: number): number {
    return Math.min(value, this.cap);
  }
}

export class PercentPrimaryPaywallTemplateAdjuster implements PrimaryPaywallTemplateAdjuster {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: PrimaryPaywallTemplate, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class PrimaryPaywallTemplateCreatedAtOffsetAdjuster implements PrimaryPaywallTemplateAdjuster {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus created at times ${this.weight}`;
  }

  adjust(item: PrimaryPaywallTemplate, value: number): number {
    return value + item.createdAt * this.weight;
  }
}

/** Runs the primary paywall template steps in order and keeps a trace of each. */
export class PrimaryPaywallTemplateEngine {
  steps: PrimaryPaywallTemplateAdjuster[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryPaywallTemplateAdjuster[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryPaywallTemplate): number {
    let current = item.adjustedExposure();
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

  evaluateAll(items: PrimaryPaywallTemplate[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryPaywallTemplateEngine(): PrimaryPaywallTemplateEngine {
  return new PrimaryPaywallTemplateEngine(
    [
      new CapPrimaryPaywallTemplateAdjuster(26482),
      new PercentPrimaryPaywallTemplateAdjuster(-5.4),
      new PrimaryPaywallTemplateCreatedAtOffsetAdjuster(0.62),
    ],
    [],
    0.3,
    93555.4,
  );
}
