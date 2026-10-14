import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultPayoutTargetEngine, defaultDefaultPayoutTargetEngine } from "./default-payout-target-engine.js";
import { DefaultPayoutTargetValidator, defaultDefaultPayoutTargetValidator } from "./default-payout-target-rules.js";
import { DefaultPayoutTargetStore } from "./default-payout-target-store.js";

/** Moves default payout targets through their life cycle and keeps a journal of what it did. */
export class DefaultPayoutTargetDesk {
  store: DefaultPayoutTargetStore;
  validator: DefaultPayoutTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPayoutTargetEngine;

  constructor(
    store: DefaultPayoutTargetStore,
    validator: DefaultPayoutTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPayoutTargetEngine,
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
      throw new Error(`default payout target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default payout target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default payout target ${code} not found`);
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

export function newDefaultPayoutTargetDesk(store: DefaultPayoutTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultPayoutTargetDesk {
  return new DefaultPayoutTargetDesk(
    store,
    defaultDefaultPayoutTargetValidator(),
    clockValue,
    [],
    defaultDefaultPayoutTargetEngine(flagsValue),
  );
}
