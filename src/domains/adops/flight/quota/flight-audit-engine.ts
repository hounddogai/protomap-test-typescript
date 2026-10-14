import * as flags from "../../../../kit/flags.js";
import * as numbers from "../../../../kit/numbers.js";
import { FlightAudit } from "./flight-audit.js";

/** One step of the flight audit calculation. */
export interface FlightAuditModifier {
  describe(): string;
  adjust(item: FlightAudit, value: number): number;
}

export class FlaggedFlightAuditAdjuster implements FlightAuditModifier {
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

  adjust(item: FlightAudit, value: number): number {
    if (!this.flags.enabled(this.flag, item.code)) return value;
    return value * (1 + this.percent / 100);
  }
}

export class MinimumFlightAuditAdjuster implements FlightAuditModifier {
  minimum: number;

  constructor(minimum: number) {
    this.minimum = minimum;
  }

  describe(): string {
    return `at least ${this.minimum}`;
  }

  adjust(item: FlightAudit, value: number): number {
    if (value < this.minimum) return this.minimum;
    return value;
  }
}

export class LocaleFlightAuditAdjuster implements FlightAuditModifier {
  factors: Map<string, number>;

  constructor(factors: Map<string, number>) {
    this.factors = factors;
  }

  describe(): string {
    return "by locale";
  }

  adjust(item: FlightAudit, value: number): number {
    const factor = this.factors.get(item.groupKey());
    if (factor === undefined) return value;
    return value * factor;
  }
}

export class FlightAuditOpenRateOffsetAdjuster implements FlightAuditModifier {
  weight: number;

  constructor(weight: number) {
    this.weight = weight;
  }

  describe(): string {
    return `plus open rate times ${this.weight}`;
  }

  adjust(item: FlightAudit, value: number): number {
    return value + item.openRate * this.weight;
  }
}

export class CapFlightAuditAdjuster implements FlightAuditModifier {
  cap: number;

  constructor(cap: number) {
    this.cap = cap;
  }

  describe(): string {
    return `cap at ${this.cap}`;
  }

  adjust(item: FlightAudit, value: number): number {
    return Math.min(value, this.cap);
  }
}

/** Runs the flight audit steps in order and keeps a trace of each. */
export class FlightAuditEngine {
  steps: FlightAuditModifier[];
  trace: string[];
  floor: number;
  ceiling: number;

  constructor(steps: FlightAuditModifier[], trace: string[], floor: number, ceiling: number) {
    this.steps = steps;
    this.trace = trace;
    this.floor = floor;
    this.ceiling = ceiling;
  }

  evaluate(item: FlightAudit): number {
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

  evaluateAll(items: FlightAudit[]): Map<string, number> {
    const results = new Map<string, number>();
    for (const item of items) {
      results.set(item.code, this.evaluate(item));
    }
    return results;
  }
}

export function defaultFlightAuditEngine(flagsValue: flags.Registry): FlightAuditEngine {
  return new FlightAuditEngine(
    [
      new FlaggedFlightAuditAdjuster(flagsValue, "flight-audit-tiered", -2.1),
      new MinimumFlightAuditAdjuster(13.9),
      new LocaleFlightAuditAdjuster(new Map<string, number>([["north", 1.2], ["east", 0.94]])),
      new FlightAuditOpenRateOffsetAdjuster(0.76),
      new CapFlightAuditAdjuster(21601),
    ],
    [],
    2.4,
    87677.7,
  );
}
