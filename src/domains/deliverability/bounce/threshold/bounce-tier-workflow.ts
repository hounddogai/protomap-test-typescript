import * as clock from "../../../../kit/clock.js";
import { BounceTierEngine, defaultBounceTierEngine } from "./bounce-tier-engine.js";
import { BounceTierValidator, defaultBounceTierValidator } from "./bounce-tier-rules.js";
import { BounceTierStore } from "./bounce-tier-store.js";

/** Moves bounce tiers through their life cycle and keeps a journal of what it did. */
export class BounceTierService {
  store: BounceTierStore;
  validator: BounceTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BounceTierEngine;

  constructor(
    store: BounceTierStore,
    validator: BounceTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BounceTierEngine,
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
      throw new Error(`bounce tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce tier ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBounceTierService(store: BounceTierStore, clockValue: clock.Clock): BounceTierService {
  return new BounceTierService(store, defaultBounceTierValidator(), clockValue, [], defaultBounceTierEngine());
}
