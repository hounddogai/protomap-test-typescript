import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryPayoutOverrideEngine, defaultPrimaryPayoutOverrideEngine } from "./primary-payout-override-engine.js";
import {
  PrimaryPayoutOverrideValidator,
  defaultPrimaryPayoutOverrideValidator,
} from "./primary-payout-override-rules.js";
import { PrimaryPayoutOverrideStore } from "./primary-payout-override-store.js";

/** Moves primary payout overrides through their life cycle and keeps a journal of what it did. */
export class PrimaryPayoutOverrideManager {
  store: PrimaryPayoutOverrideStore;
  validator: PrimaryPayoutOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryPayoutOverrideEngine;

  constructor(
    store: PrimaryPayoutOverrideStore,
    validator: PrimaryPayoutOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryPayoutOverrideEngine,
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
      throw new Error(`primary payout override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary payout override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary payout override ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPrimaryPayoutOverrideManager(store: PrimaryPayoutOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryPayoutOverrideManager {
  return new PrimaryPayoutOverrideManager(
    store,
    defaultPrimaryPayoutOverrideValidator(),
    clockValue,
    [],
    defaultPrimaryPayoutOverrideEngine(flagsValue),
  );
}
