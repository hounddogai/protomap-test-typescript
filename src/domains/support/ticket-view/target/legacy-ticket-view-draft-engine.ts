import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { LegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

/** One step of the legacy ticket view draft calculation. */
export interface LegacyTicketViewDraftModifier {
  describe(): string;
  adjust(item: LegacyTicketViewDraft, value: number): number;
}

export class PercentLegacyTicketViewDraftAdjuster implements LegacyTicketViewDraftModifier {
  percent: number;

  constructor(percent: number) {
    this.percent = percent;
  }

  describe(): string {
    return `${this.percent}% change`;
  }

  adjust(item: LegacyTicketViewDraft, value: number): number {
    return value * (1 + this.percent / 100);
  }
}

export class MinimumLegacyTicketViewDraftAdjuster implements LegacyTicketViewDraftModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: LegacyTicketViewDraft, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class FlaggedLegacyTicketViewDraftAdjuster implements LegacyTicketViewDraftModifier {
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

  adjust(item: LegacyTicketViewDraft, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class LegacyTicketViewDraftSendAtOffsetAdjuster implements LegacyTicketViewDraftModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus send at times ${this.weight}`;
  }

  adjust(item: LegacyTicketViewDraft, value: number): number {
    return value + item.sendAt * this.weight;
  }
}

export class CapLegacyTicketViewDraftAdjuster implements LegacyTicketViewDraftModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: LegacyTicketViewDraft, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the legacy ticket view draft steps in order and keeps a trace of each. */
export class LegacyTicketViewDraftEngine {
  steps: LegacyTicketViewDraftModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: LegacyTicketViewDraftModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: LegacyTicketViewDraft): number {
    let current = item.adjustedValue();
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

  evaluateAll(items: LegacyTicketViewDraft[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultLegacyTicketViewDraftEngine(flagsValue: flags.Registry): LegacyTicketViewDraftEngine {
  return new LegacyTicketViewDraftEngine(
    [
      new PercentLegacyTicketViewDraftAdjuster(17.7),
      new MinimumLegacyTicketViewDraftAdjuster(31.3),
      new FlaggedLegacyTicketViewDraftAdjuster(flagsValue, "legacy-ticket-view-draft-pending", -0.8),
      new LegacyTicketViewDraftSendAtOffsetAdjuster(0.83),
      new CapLegacyTicketViewDraftAdjuster(17444),
    ],
    [],
    4.9,
    25429.2,
  );
}
