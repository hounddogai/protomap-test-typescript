import * as clock from "../../../../kit/clock.js";
import { DeflectionTierEngine, defaultDeflectionTierEngine } from "./deflection-tier-engine.js";
import { DeflectionTierValidator, defaultDeflectionTierValidator } from "./deflection-tier-rules.js";
import { DeflectionTierStore } from "./deflection-tier-store.js";

/** Moves deflection tiers through their life cycle and keeps a journal of what it did. */
export class DeflectionTierDesk {
  store: DeflectionTierStore;
  validator: DeflectionTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DeflectionTierEngine;

  constructor(
    store: DeflectionTierStore,
    validator: DeflectionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DeflectionTierEngine,
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
      throw new Error(`deflection tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection tier ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newDeflectionTierDesk(store: DeflectionTierStore, clockValue: clock.Clock): DeflectionTierDesk {
  return new DeflectionTierDesk(store, defaultDeflectionTierValidator(), clockValue, [], defaultDeflectionTierEngine());
}
