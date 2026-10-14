import * as clock from "../../../../kit/clock.js";
import { WindowCycleEngine, defaultWindowCycleEngine } from "./window-cycle-engine.js";
import { WindowCycleValidator, defaultWindowCycleValidator } from "./window-cycle-rules.js";
import { WindowCycleStore } from "./window-cycle-store.js";

/** Moves window cycles through their life cycle and keeps a journal of what it did. */
export class WindowCycleService {
  store: WindowCycleStore;
  validator: WindowCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowCycleEngine;

  constructor(
    store: WindowCycleStore,
    validator: WindowCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowCycleEngine,
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
      throw new Error(`window cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window cycle ${code} not found`);
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
      throw new Error(`window cycle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWindowCycleService(store: WindowCycleStore, clockValue: clock.Clock): WindowCycleService {
  return new WindowCycleService(store, defaultWindowCycleValidator(), clockValue, [], defaultWindowCycleEngine());
}
