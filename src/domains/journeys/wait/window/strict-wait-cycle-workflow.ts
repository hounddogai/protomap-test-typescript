import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictWaitCycleEngine, defaultStrictWaitCycleEngine } from "./strict-wait-cycle-engine.js";
import { StrictWaitCycleValidator, defaultStrictWaitCycleValidator } from "./strict-wait-cycle-rules.js";
import { StrictWaitCycleStore } from "./strict-wait-cycle-store.js";

/** Moves strict wait cycles through their life cycle and keeps a journal of what it did. */
export class StrictWaitCycleManager {
  store: StrictWaitCycleStore;
  validator: StrictWaitCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictWaitCycleEngine;

  constructor(
    store: StrictWaitCycleStore,
    validator: StrictWaitCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictWaitCycleEngine,
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
      throw new Error(`strict wait cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict wait cycle ${code} not found`);
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
      throw new Error(`strict wait cycle ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newStrictWaitCycleManager(store: StrictWaitCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictWaitCycleManager {
  return new StrictWaitCycleManager(
    store,
    defaultStrictWaitCycleValidator(),
    clockValue,
    [],
    defaultStrictWaitCycleEngine(flagsValue),
  );
}
