import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientPostWindowEngine, defaultLenientPostWindowEngine } from "./lenient-post-window-engine.js";
import { LenientPostWindowValidator, defaultLenientPostWindowValidator } from "./lenient-post-window-rules.js";
import { LenientPostWindowStore } from "./lenient-post-window-store.js";

/** Moves lenient post windows through their life cycle and keeps a journal of what it did. */
export class LenientPostWindowCoordinator {
  store: LenientPostWindowStore;
  validator: LenientPostWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientPostWindowEngine;

  constructor(
    store: LenientPostWindowStore,
    validator: LenientPostWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientPostWindowEngine,
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
      throw new Error(`lenient post window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient post window ${code} not found`);
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
      throw new Error(`lenient post window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newLenientPostWindowCoordinator(store: LenientPostWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientPostWindowCoordinator {
  return new LenientPostWindowCoordinator(
    store,
    defaultLenientPostWindowValidator(),
    clockValue,
    [],
    defaultLenientPostWindowEngine(flagsValue),
  );
}
