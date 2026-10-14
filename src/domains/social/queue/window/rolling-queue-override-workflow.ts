import * as clock from "../../../../kit/clock.js";
import { RollingQueueOverrideEngine, defaultRollingQueueOverrideEngine } from "./rolling-queue-override-engine.js";
import {
  RollingQueueOverrideValidator,
  defaultRollingQueueOverrideValidator,
} from "./rolling-queue-override-rules.js";
import { RollingQueueOverrideStore } from "./rolling-queue-override-store.js";

/** Moves rolling queue overrides through their life cycle and keeps a journal of what it did. */
export class RollingQueueOverrideService {
  store: RollingQueueOverrideStore;
  validator: RollingQueueOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingQueueOverrideEngine;

  constructor(
    store: RollingQueueOverrideStore,
    validator: RollingQueueOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingQueueOverrideEngine,
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
      throw new Error(`rolling queue override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling queue override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling queue override ${code} not found`);
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

export function newRollingQueueOverrideService(store: RollingQueueOverrideStore, clockValue: clock.Clock): RollingQueueOverrideService {
  return new RollingQueueOverrideService(
    store,
    defaultRollingQueueOverrideValidator(),
    clockValue,
    [],
    defaultRollingQueueOverrideEngine(),
  );
}
