import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredActivationDigestEngine,
  defaultTieredActivationDigestEngine,
} from "./tiered-activation-digest-engine.js";
import {
  TieredActivationDigestValidator,
  defaultTieredActivationDigestValidator,
} from "./tiered-activation-digest-rules.js";
import { TieredActivationDigestStore } from "./tiered-activation-digest-store.js";

/** Moves tiered activation digests through their life cycle and keeps a journal of what it did. */
export class TieredActivationDigestWorkflow {
  store: TieredActivationDigestStore;
  validator: TieredActivationDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredActivationDigestEngine;

  constructor(
    store: TieredActivationDigestStore,
    validator: TieredActivationDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredActivationDigestEngine,
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
      throw new Error(`tiered activation digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered activation digest ${code} not found`);
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
      throw new Error(`tiered activation digest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredActivationDigestWorkflow(store: TieredActivationDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredActivationDigestWorkflow {
  return new TieredActivationDigestWorkflow(
    store,
    defaultTieredActivationDigestValidator(),
    clockValue,
    [],
    defaultTieredActivationDigestEngine(flagsValue),
  );
}
