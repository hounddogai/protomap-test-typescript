import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreativeCycleEngine, defaultCreativeCycleEngine } from "./creative-cycle-engine.js";
import { CreativeCycleValidator, defaultCreativeCycleValidator } from "./creative-cycle-rules.js";
import { CreativeCycleStore } from "./creative-cycle-store.js";

/** Moves creative cycles through their life cycle and keeps a journal of what it did. */
export class CreativeCycleDesk {
  store: CreativeCycleStore;
  validator: CreativeCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeCycleEngine;

  constructor(
    store: CreativeCycleStore,
    validator: CreativeCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeCycleEngine,
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
      throw new Error(`creative cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative cycle ${code} not found`);
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

export function newCreativeCycleDesk(store: CreativeCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreativeCycleDesk {
  return new CreativeCycleDesk(
    store,
    defaultCreativeCycleValidator(),
    clockValue,
    [],
    defaultCreativeCycleEngine(flagsValue),
  );
}
