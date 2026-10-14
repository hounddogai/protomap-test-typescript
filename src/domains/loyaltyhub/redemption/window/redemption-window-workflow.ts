import * as clock from "../../../../kit/clock.js";
import { RedemptionWindowEngine, defaultRedemptionWindowEngine } from "./redemption-window-engine.js";
import { RedemptionWindowValidator, defaultRedemptionWindowValidator } from "./redemption-window-rules.js";
import { RedemptionWindowStore } from "./redemption-window-store.js";

/** Moves redemption windows through their life cycle and keeps a journal of what it did. */
export class RedemptionWindowManager {
  store: RedemptionWindowStore;
  validator: RedemptionWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RedemptionWindowEngine;

  constructor(
    store: RedemptionWindowStore,
    validator: RedemptionWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RedemptionWindowEngine,
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
      throw new Error(`redemption window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption window ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newRedemptionWindowManager(store: RedemptionWindowStore, clockValue: clock.Clock): RedemptionWindowManager {
  return new RedemptionWindowManager(
    store,
    defaultRedemptionWindowValidator(),
    clockValue,
    [],
    defaultRedemptionWindowEngine(),
  );
}
