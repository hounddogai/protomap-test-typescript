import * as clock from "../../../../kit/clock.js";
import { ActivationSlotEngine, defaultActivationSlotEngine } from "./activation-slot-engine.js";
import { ActivationSlotValidator, defaultActivationSlotValidator } from "./activation-slot-rules.js";
import { ActivationSlotStore } from "./activation-slot-store.js";

/** Moves activation slots through their life cycle and keeps a journal of what it did. */
export class ActivationSlotDesk {
  store: ActivationSlotStore;
  validator: ActivationSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationSlotEngine;

  constructor(
    store: ActivationSlotStore,
    validator: ActivationSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationSlotEngine,
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
      throw new Error(`activation slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation slot ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newActivationSlotDesk(store: ActivationSlotStore, clockValue: clock.Clock): ActivationSlotDesk {
  return new ActivationSlotDesk(store, defaultActivationSlotValidator(), clockValue, [], defaultActivationSlotEngine());
}
