import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreativeGroupEngine, defaultCreativeGroupEngine } from "./creative-group-engine.js";
import { CreativeGroupValidator, defaultCreativeGroupValidator } from "./creative-group-rules.js";
import { CreativeGroupStore } from "./creative-group-store.js";

/** Moves creative groups through their life cycle and keeps a journal of what it did. */
export class CreativeGroupCoordinator {
  store: CreativeGroupStore;
  validator: CreativeGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeGroupEngine;

  constructor(
    store: CreativeGroupStore,
    validator: CreativeGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeGroupEngine,
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
      throw new Error(`creative group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative group ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newCreativeGroupCoordinator(store: CreativeGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreativeGroupCoordinator {
  return new CreativeGroupCoordinator(
    store,
    defaultCreativeGroupValidator(),
    clockValue,
    [],
    defaultCreativeGroupEngine(flagsValue),
  );
}
