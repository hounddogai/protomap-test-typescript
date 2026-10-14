import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  StrictReputationOverrideEngine,
  defaultStrictReputationOverrideEngine,
} from "./strict-reputation-override-engine.js";
import {
  StrictReputationOverrideValidator,
  defaultStrictReputationOverrideValidator,
} from "./strict-reputation-override-rules.js";
import { StrictReputationOverrideStore } from "./strict-reputation-override-store.js";

/** Moves strict reputation overrides through their life cycle and keeps a journal of what it did. */
export class StrictReputationOverrideCoordinator {
  store: StrictReputationOverrideStore;
  validator: StrictReputationOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictReputationOverrideEngine;

  constructor(
    store: StrictReputationOverrideStore,
    validator: StrictReputationOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictReputationOverrideEngine,
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
      throw new Error(`strict reputation override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict reputation override ${code} not found`);
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
      throw new Error(`strict reputation override ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newStrictReputationOverrideCoordinator(store: StrictReputationOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictReputationOverrideCoordinator {
  return new StrictReputationOverrideCoordinator(
    store,
    defaultStrictReputationOverrideValidator(),
    clockValue,
    [],
    defaultStrictReputationOverrideEngine(flagsValue),
  );
}
