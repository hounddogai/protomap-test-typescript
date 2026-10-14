import * as clock from "../../../../kit/clock.js";
import { TieredPreferenceGroupEngine, defaultTieredPreferenceGroupEngine } from "./tiered-preference-group-engine.js";
import {
  TieredPreferenceGroupValidator,
  defaultTieredPreferenceGroupValidator,
} from "./tiered-preference-group-rules.js";
import { TieredPreferenceGroupStore } from "./tiered-preference-group-store.js";

/** Moves tiered preference groups through their life cycle and keeps a journal of what it did. */
export class TieredPreferenceGroupDesk {
  store: TieredPreferenceGroupStore;
  validator: TieredPreferenceGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredPreferenceGroupEngine;

  constructor(
    store: TieredPreferenceGroupStore,
    validator: TieredPreferenceGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredPreferenceGroupEngine,
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
      throw new Error(`tiered preference group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered preference group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered preference group ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredPreferenceGroupDesk(store: TieredPreferenceGroupStore, clockValue: clock.Clock): TieredPreferenceGroupDesk {
  return new TieredPreferenceGroupDesk(
    store,
    defaultTieredPreferenceGroupValidator(),
    clockValue,
    [],
    defaultTieredPreferenceGroupEngine(),
  );
}
