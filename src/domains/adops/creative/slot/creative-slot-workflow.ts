import * as clock from "../../../../kit/clock.js";
import { CreativeSlotEngine, defaultCreativeSlotEngine } from "./creative-slot-engine.js";
import { CreativeSlotValidator, defaultCreativeSlotValidator } from "./creative-slot-rules.js";
import { CreativeSlotStore } from "./creative-slot-store.js";

/** Moves creative slots through their life cycle and keeps a journal of what it did. */
export class CreativeSlotDesk {
  store: CreativeSlotStore;
  validator: CreativeSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeSlotEngine;

  constructor(
    store: CreativeSlotStore,
    validator: CreativeSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeSlotEngine,
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
      throw new Error(`creative slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative slot ${code} not found`);
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
      throw new Error(`creative slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newCreativeSlotDesk(store: CreativeSlotStore, clockValue: clock.Clock): CreativeSlotDesk {
  return new CreativeSlotDesk(store, defaultCreativeSlotValidator(), clockValue, [], defaultCreativeSlotEngine());
}
