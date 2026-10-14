import * as clock from "../../../../kit/clock.js";
import { PacingTierEngine, defaultPacingTierEngine } from "./pacing-tier-engine.js";
import { PacingTierValidator, defaultPacingTierValidator } from "./pacing-tier-rules.js";
import { PacingTierStore } from "./pacing-tier-store.js";

/** Moves pacing tiers through their life cycle and keeps a journal of what it did. */
export class PacingTierDesk {
  store: PacingTierStore;
  validator: PacingTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingTierEngine;

  constructor(
    store: PacingTierStore,
    validator: PacingTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingTierEngine,
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
      throw new Error(`pacing tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing tier ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPacingTierDesk(store: PacingTierStore, clockValue: clock.Clock): PacingTierDesk {
  return new PacingTierDesk(store, defaultPacingTierValidator(), clockValue, [], defaultPacingTierEngine());
}
