import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictActivationClaimEngine, defaultStrictActivationClaimEngine } from "./strict-activation-claim-engine.js";
import {
  StrictActivationClaimValidator,
  defaultStrictActivationClaimValidator,
} from "./strict-activation-claim-rules.js";
import { StrictActivationClaimStore } from "./strict-activation-claim-store.js";

/** Moves strict activation claims through their life cycle and keeps a journal of what it did. */
export class StrictActivationClaimManager {
  store: StrictActivationClaimStore;
  validator: StrictActivationClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictActivationClaimEngine;

  constructor(
    store: StrictActivationClaimStore,
    validator: StrictActivationClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictActivationClaimEngine,
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
      throw new Error(`strict activation claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict activation claim ${code} not found`);
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
      throw new Error(`strict activation claim ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newStrictActivationClaimManager(store: StrictActivationClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictActivationClaimManager {
  return new StrictActivationClaimManager(
    store,
    defaultStrictActivationClaimValidator(),
    clockValue,
    [],
    defaultStrictActivationClaimEngine(flagsValue),
  );
}
