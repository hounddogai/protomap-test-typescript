import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalSubscriptionEstimateEngine,
  defaultGlobalSubscriptionEstimateEngine,
} from "./global-subscription-estimate-engine.js";
import {
  GlobalSubscriptionEstimateValidator,
  defaultGlobalSubscriptionEstimateValidator,
} from "./global-subscription-estimate-rules.js";
import { GlobalSubscriptionEstimateStore } from "./global-subscription-estimate-store.js";

/** Moves global subscription estimates through their life cycle and keeps a journal of what it did. */
export class GlobalSubscriptionEstimateDesk {
  store: GlobalSubscriptionEstimateStore;
  validator: GlobalSubscriptionEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalSubscriptionEstimateEngine;

  constructor(
    store: GlobalSubscriptionEstimateStore,
    validator: GlobalSubscriptionEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalSubscriptionEstimateEngine,
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
      throw new Error(`global subscription estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global subscription estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global subscription estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newGlobalSubscriptionEstimateDesk(store: GlobalSubscriptionEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalSubscriptionEstimateDesk {
  return new GlobalSubscriptionEstimateDesk(
    store,
    defaultGlobalSubscriptionEstimateValidator(),
    clockValue,
    [],
    defaultGlobalSubscriptionEstimateEngine(flagsValue),
  );
}
