import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredTierCycleEngine, defaultTieredTierCycleEngine } from "./tiered-tier-cycle-engine.js";
import { TieredTierCycleValidator, defaultTieredTierCycleValidator } from "./tiered-tier-cycle-rules.js";
import { TieredTierCycleStore } from "./tiered-tier-cycle-store.js";

/** Moves tiered tier cycles through their life cycle and keeps a journal of what it did. */
export class TieredTierCycleService {
  store: TieredTierCycleStore;
  validator: TieredTierCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredTierCycleEngine;

  constructor(
    store: TieredTierCycleStore,
    validator: TieredTierCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredTierCycleEngine,
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
      throw new Error(`tiered tier cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered tier cycle ${code} not found`);
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
      throw new Error(`tiered tier cycle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredTierCycleService(store: TieredTierCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredTierCycleService {
  return new TieredTierCycleService(
    store,
    defaultTieredTierCycleValidator(),
    clockValue,
    [],
    defaultTieredTierCycleEngine(flagsValue),
  );
}
