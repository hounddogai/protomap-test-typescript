import * as clock from "../../../../kit/clock.js";
import { TieredOptOutWindowEngine, defaultTieredOptOutWindowEngine } from "./tiered-opt-out-window-engine.js";
import { TieredOptOutWindowValidator, defaultTieredOptOutWindowValidator } from "./tiered-opt-out-window-rules.js";
import { TieredOptOutWindowStore } from "./tiered-opt-out-window-store.js";

/** Moves tiered opt out windows through their life cycle and keeps a journal of what it did. */
export class TieredOptOutWindowCoordinator {
  store: TieredOptOutWindowStore;
  validator: TieredOptOutWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredOptOutWindowEngine;

  constructor(
    store: TieredOptOutWindowStore,
    validator: TieredOptOutWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredOptOutWindowEngine,
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
      throw new Error(`tiered opt out window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered opt out window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered opt out window ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newTieredOptOutWindowCoordinator(store: TieredOptOutWindowStore, clockValue: clock.Clock): TieredOptOutWindowCoordinator {
  return new TieredOptOutWindowCoordinator(
    store,
    defaultTieredOptOutWindowValidator(),
    clockValue,
    [],
    defaultTieredOptOutWindowEngine(),
  );
}
