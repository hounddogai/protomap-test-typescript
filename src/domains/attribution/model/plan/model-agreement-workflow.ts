import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ModelAgreementEngine, defaultModelAgreementEngine } from "./model-agreement-engine.js";
import { ModelAgreementValidator, defaultModelAgreementValidator } from "./model-agreement-rules.js";
import { ModelAgreementStore } from "./model-agreement-store.js";

/** Moves model agreements through their life cycle and keeps a journal of what it did. */
export class ModelAgreementCoordinator {
  store: ModelAgreementStore;
  validator: ModelAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelAgreementEngine;

  constructor(
    store: ModelAgreementStore,
    validator: ModelAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelAgreementEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model agreement ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newModelAgreementCoordinator(store: ModelAgreementStore, clockValue: clock.Clock, flagsValue: flags.Registry): ModelAgreementCoordinator {
  return new ModelAgreementCoordinator(
    store,
    defaultModelAgreementValidator(),
    clockValue,
    [],
    defaultModelAgreementEngine(flagsValue),
  );
}
