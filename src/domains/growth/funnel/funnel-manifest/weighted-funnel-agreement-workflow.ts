import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedFunnelAgreementEngine,
  defaultWeightedFunnelAgreementEngine,
} from "./weighted-funnel-agreement-engine.js";
import {
  WeightedFunnelAgreementValidator,
  defaultWeightedFunnelAgreementValidator,
} from "./weighted-funnel-agreement-rules.js";
import { WeightedFunnelAgreementStore } from "./weighted-funnel-agreement-store.js";

/** Moves weighted funnel agreements through their life cycle and keeps a journal of what it did. */
export class WeightedFunnelAgreementWorkflow {
  store: WeightedFunnelAgreementStore;
  validator: WeightedFunnelAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedFunnelAgreementEngine;

  constructor(
    store: WeightedFunnelAgreementStore,
    validator: WeightedFunnelAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedFunnelAgreementEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted funnel agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted funnel agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted funnel agreement ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedFunnelAgreementWorkflow(store: WeightedFunnelAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedFunnelAgreementWorkflow {
  return new WeightedFunnelAgreementWorkflow(
    store,
    defaultWeightedFunnelAgreementValidator(),
    clockValue,
    [],
    defaultWeightedFunnelAgreementEngine(flagsValue),
  );
}
