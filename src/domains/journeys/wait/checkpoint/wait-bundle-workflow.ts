import * as clock from "../../../../kit/clock.js";
import { WaitBundleEngine, defaultWaitBundleEngine } from "./wait-bundle-engine.js";
import { WaitBundleValidator, defaultWaitBundleValidator } from "./wait-bundle-rules.js";
import { WaitBundleStore } from "./wait-bundle-store.js";

/** Moves wait bundles through their life cycle and keeps a journal of what it did. */
export class WaitBundleService {
  store: WaitBundleStore;
  validator: WaitBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitBundleEngine;

  constructor(
    store: WaitBundleStore,
    validator: WaitBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitBundleEngine,
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
      throw new Error(`wait bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait bundle ${code} not found`);
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
      throw new Error(`wait bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWaitBundleService(store: WaitBundleStore, clockValue: clock.Clock): WaitBundleService {
  return new WaitBundleService(store, defaultWaitBundleValidator(), clockValue, [], defaultWaitBundleEngine());
}
