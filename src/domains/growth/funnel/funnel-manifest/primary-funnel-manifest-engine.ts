import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { PrimaryFunnelManifest } from "./primary-funnel-manifest.js";

/** One step of the primary funnel manifest calculation. */
export interface PrimaryFunnelManifestStep {
  describe(): string;
  adjust(item: PrimaryFunnelManifest, value: number): number;
}

export class PrimaryFunnelManifestPriorityOffsetAdjuster implements PrimaryFunnelManifestStep {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus priority times ${this.weight}`;
  }

  adjust(item: PrimaryFunnelManifest, value: number): number {
    return value + item.priority * this.weight;
  }
}

export class FlaggedPrimaryFunnelManifestAdjuster implements PrimaryFunnelManifestStep {
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

  adjust(item: PrimaryFunnelManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class RoundingPrimaryFunnelManifestAdjuster implements PrimaryFunnelManifestStep {
  step: number;

  constructor(step: number) {
    this.step = step;
  }

  describe(): string {
    return `round to ${this.step}`;
  }

  adjust(item: PrimaryFunnelManifest, value: number): number {
    return numbers.roundTo(value, this.step);
  }
}

export class CapPrimaryFunnelManifestAdjuster implements PrimaryFunnelManifestStep {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: PrimaryFunnelManifest, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the primary funnel manifest steps in order and keeps a trace of each. */
export class PrimaryFunnelManifestEngine {
  steps: PrimaryFunnelManifestStep[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: PrimaryFunnelManifestStep[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: PrimaryFunnelManifest): number {
    let current = item.adjustedVolume();
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

  evaluateAll(items: PrimaryFunnelManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultPrimaryFunnelManifestEngine(flagsValue: flags.Registry): PrimaryFunnelManifestEngine {
  return new PrimaryFunnelManifestEngine(
    [
      new PrimaryFunnelManifestPriorityOffsetAdjuster(1.14),
      new FlaggedPrimaryFunnelManifestAdjuster(flagsValue, "primary-funnel-manifest-batched", -7.4),
      new RoundingPrimaryFunnelManifestAdjuster(0.25),
      new CapPrimaryFunnelManifestAdjuster(2456),
    ],
    [],
    0.2,
    19624.1,
  );
}
