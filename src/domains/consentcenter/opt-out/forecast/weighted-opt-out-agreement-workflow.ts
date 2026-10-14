import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedOptOutAgreementEngine,
  defaultWeightedOptOutAgreementEngine,
} from "./weighted-opt-out-agreement-engine.js";
import {
  WeightedOptOutAgreementValidator,
  defaultWeightedOptOutAgreementValidator,
} from "./weighted-opt-out-agreement-rules.js";
import { WeightedOptOutAgreementStore } from "./weighted-opt-out-agreement-store.js";

/** Moves weighted opt out agreements through their life cycle and keeps a journal of what it did. */
export class WeightedOptOutAgreementWorkflow {
  store: WeightedOptOutAgreementStore;
  validator: WeightedOptOutAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedOptOutAgreementEngine;

  constructor(
    store: WeightedOptOutAgreementStore,
    validator: WeightedOptOutAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedOptOutAgreementEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted opt out agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted opt out agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted opt out agreement ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newWeightedOptOutAgreementWorkflow(store: WeightedOptOutAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedOptOutAgreementWorkflow {
  return new WeightedOptOutAgreementWorkflow(
    store,
    defaultWeightedOptOutAgreementValidator(),
    clockValue,
    [],
    defaultWeightedOptOutAgreementEngine(flagsValue),
  );
}
