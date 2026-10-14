import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredBadgeProfileEngine, defaultTieredBadgeProfileEngine } from "./tiered-badge-profile-engine.js";
import { TieredBadgeProfileValidator, defaultTieredBadgeProfileValidator } from "./tiered-badge-profile-rules.js";
import { TieredBadgeProfileStore } from "./tiered-badge-profile-store.js";

/** Moves tiered badge profiles through their life cycle and keeps a journal of what it did. */
export class TieredBadgeProfileDesk {
  store: TieredBadgeProfileStore;
  validator: TieredBadgeProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredBadgeProfileEngine;

  constructor(
    store: TieredBadgeProfileStore,
    validator: TieredBadgeProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredBadgeProfileEngine,
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
      throw new Error(`tiered badge profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered badge profile ${code} not found`);
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
      throw new Error(`tiered badge profile ${code} not found`);
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

export function newTieredBadgeProfileDesk(store: TieredBadgeProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredBadgeProfileDesk {
  return new TieredBadgeProfileDesk(
    store,
    defaultTieredBadgeProfileValidator(),
    clockValue,
    [],
    defaultTieredBadgeProfileEngine(flagsValue),
  );
}
