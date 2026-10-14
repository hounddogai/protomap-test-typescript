import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedCreditSlotEngine, defaultWeightedCreditSlotEngine } from "./weighted-credit-slot-engine.js";
import { WeightedCreditSlotValidator, defaultWeightedCreditSlotValidator } from "./weighted-credit-slot-rules.js";
import { WeightedCreditSlotStore } from "./weighted-credit-slot-store.js";

/** Moves weighted credit slots through their life cycle and keeps a journal of what it did. */
export class WeightedCreditSlotDesk {
  store: WeightedCreditSlotStore;
  validator: WeightedCreditSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedCreditSlotEngine;

  constructor(
    store: WeightedCreditSlotStore,
    validator: WeightedCreditSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedCreditSlotEngine,
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
      throw new Error(`weighted credit slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted credit slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted credit slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedCreditSlotDesk(store: WeightedCreditSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedCreditSlotDesk {
  return new WeightedCreditSlotDesk(
    store,
    defaultWeightedCreditSlotValidator(),
    clockValue,
    [],
    defaultWeightedCreditSlotEngine(flagsValue),
  );
}
