import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TierGroupEngine, defaultTierGroupEngine } from "./tier-group-engine.js";
import { TierGroupValidator, defaultTierGroupValidator } from "./tier-group-rules.js";
import { TierGroupStore } from "./tier-group-store.js";

/** Moves tier groups through their life cycle and keeps a journal of what it did. */
export class TierGroupManager {
  store: TierGroupStore;
  validator: TierGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TierGroupEngine;

  constructor(
    store: TierGroupStore,
    validator: TierGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TierGroupEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier group ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTierGroupManager(store: TierGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): TierGroupManager {
  return new TierGroupManager(store, defaultTierGroupValidator(), clockValue, [], defaultTierGroupEngine(flagsValue));
}
