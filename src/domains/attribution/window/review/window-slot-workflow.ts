import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WindowSlotEngine, defaultWindowSlotEngine } from "./window-slot-engine.js";
import { WindowSlotValidator, defaultWindowSlotValidator } from "./window-slot-rules.js";
import { WindowSlotStore } from "./window-slot-store.js";

/** Moves window slots through their life cycle and keeps a journal of what it did. */
export class WindowSlotDesk {
  store: WindowSlotStore;
  validator: WindowSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowSlotEngine;

  constructor(
    store: WindowSlotStore,
    validator: WindowSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowSlotEngine,
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
      throw new Error(`window slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window slot ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newWindowSlotDesk(store: WindowSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): WindowSlotDesk {
  return new WindowSlotDesk(store, defaultWindowSlotValidator(), clockValue, [], defaultWindowSlotEngine(flagsValue));
}
