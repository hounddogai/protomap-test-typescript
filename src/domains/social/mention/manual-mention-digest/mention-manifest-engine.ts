import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { MentionManifest } from "./mention-manifest.js";

/** One step of the mention manifest calculation. */
export interface MentionManifestModifier {
  describe(): string;
  adjust(item: MentionManifest, value: number): number;
}

export class MentionManifestImpressionsOffsetAdjuster implements MentionManifestModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus impressions times ${this.weight}`;
  }

  adjust(item: MentionManifest, value: number): number {
    return value + item.impressions * this.weight;
  }
}

export class PercentMentionManifestAdjuster implements MentionManifestModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: MentionManifest, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class FlaggedMentionManifestAdjuster implements MentionManifestModifier {
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

  adjust(item: MentionManifest, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

/** Runs the mention manifest steps in order and keeps a trace of each. */
export class MentionManifestEngine {
  steps: MentionManifestModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: MentionManifestModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  price(item: MentionManifest): number {
    let current = item.measuredValue();
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

  evaluateAll(items: MentionManifest[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.price(item));
    }
    return results;
  }
}

export function defaultMentionManifestEngine(flagsValue: flags.Registry): MentionManifestEngine {
  return new MentionManifestEngine(
    [
      new MentionManifestImpressionsOffsetAdjuster(0.95),
      new PercentMentionManifestAdjuster(-24.6),
      new FlaggedMentionManifestAdjuster(flagsValue, "mention-manifest-default", 1.2),
    ],
    [],
    4,
    34054.2,
  );
}
