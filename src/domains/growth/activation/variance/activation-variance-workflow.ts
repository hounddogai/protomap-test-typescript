import * as clock from "../../../../kit/clock.js";
import { ActivationVarianceEngine, defaultActivationVarianceEngine } from "./activation-variance-engine.js";
import { ActivationVarianceValidator, defaultActivationVarianceValidator } from "./activation-variance-rules.js";
import { ActivationVarianceStore } from "./activation-variance-store.js";

/** Moves activation variances through their life cycle and keeps a journal of what it did. */
export class ActivationVarianceDesk {
  store: ActivationVarianceStore;
  validator: ActivationVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationVarianceEngine;

  constructor(
    store: ActivationVarianceStore,
    validator: ActivationVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationVarianceEngine,
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
      throw new Error(`activation variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation variance ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newActivationVarianceDesk(store: ActivationVarianceStore, clockValue: clock.Clock): ActivationVarianceDesk {
  return new ActivationVarianceDesk(
    store,
    defaultActivationVarianceValidator(),
    clockValue,
    [],
    defaultActivationVarianceEngine(),
  );
}
