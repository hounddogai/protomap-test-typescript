import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SubscriptionCheckpointEngine,
  defaultSubscriptionCheckpointEngine,
} from "./subscription-checkpoint-engine.js";
import {
  SubscriptionCheckpointValidator,
  defaultSubscriptionCheckpointValidator,
} from "./subscription-checkpoint-rules.js";
import { SubscriptionCheckpointStore } from "./subscription-checkpoint-store.js";

/** Moves subscription checkpoints through their life cycle and keeps a journal of what it did. */
export class SubscriptionCheckpointManager {
  store: SubscriptionCheckpointStore;
  validator: SubscriptionCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionCheckpointEngine;

  constructor(
    store: SubscriptionCheckpointStore,
    validator: SubscriptionCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionCheckpointEngine,
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
      throw new Error(`subscription checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription checkpoint ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newSubscriptionCheckpointManager(store: SubscriptionCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionCheckpointManager {
  return new SubscriptionCheckpointManager(
    store,
    defaultSubscriptionCheckpointValidator(),
    clockValue,
    [],
    defaultSubscriptionCheckpointEngine(flagsValue),
  );
}
