import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  DefaultRedemptionOverrideEngine,
  defaultDefaultRedemptionOverrideEngine,
} from "./default-redemption-override-engine.js";
import {
  DefaultRedemptionOverrideValidator,
  defaultDefaultRedemptionOverrideValidator,
} from "./default-redemption-override-rules.js";
import { DefaultRedemptionOverrideStore } from "./default-redemption-override-store.js";

/** Moves default redemption overrides through their life cycle and keeps a journal of what it did. */
export class DefaultRedemptionOverrideDesk {
  store: DefaultRedemptionOverrideStore;
  validator: DefaultRedemptionOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultRedemptionOverrideEngine;

  constructor(
    store: DefaultRedemptionOverrideStore,
    validator: DefaultRedemptionOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultRedemptionOverrideEngine,
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
      throw new Error(`default redemption override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default redemption override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default redemption override ${code} not found`);
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

export function newDefaultRedemptionOverrideDesk(store: DefaultRedemptionOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultRedemptionOverrideDesk {
  return new DefaultRedemptionOverrideDesk(
    store,
    defaultDefaultRedemptionOverrideValidator(),
    clockValue,
    [],
    defaultDefaultRedemptionOverrideEngine(flagsValue),
  );
}
