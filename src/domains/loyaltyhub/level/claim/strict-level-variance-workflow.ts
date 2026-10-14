import * as clock from "../../../../kit/clock.js";
import { StrictLevelVarianceValidator, defaultStrictLevelVarianceValidator } from "./strict-level-variance-rules.js";
import { StrictLevelVarianceStore } from "./strict-level-variance-store.js";

/** Moves strict level variances through their life cycle and keeps a journal of what it did. */
export class StrictLevelVarianceManager {
  store: StrictLevelVarianceStore;
  validator: StrictLevelVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictLevelVarianceStore,
    validator: StrictLevelVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict level variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict level variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newStrictLevelVarianceManager(store: StrictLevelVarianceStore, clockValue: clock.Clock): StrictLevelVarianceManager {
  return new StrictLevelVarianceManager(store, defaultStrictLevelVarianceValidator(), clockValue, []);
}
