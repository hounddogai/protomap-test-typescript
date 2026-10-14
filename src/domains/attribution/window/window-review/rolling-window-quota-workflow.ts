import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingWindowQuotaEngine, defaultRollingWindowQuotaEngine } from "./rolling-window-quota-engine.js";
import { RollingWindowQuotaValidator, defaultRollingWindowQuotaValidator } from "./rolling-window-quota-rules.js";
import { RollingWindowQuotaStore } from "./rolling-window-quota-store.js";

/** Moves rolling window quotas through their life cycle and keeps a journal of what it did. */
export class RollingWindowQuotaCoordinator {
  store: RollingWindowQuotaStore;
  validator: RollingWindowQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingWindowQuotaEngine;

  constructor(
    store: RollingWindowQuotaStore,
    validator: RollingWindowQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingWindowQuotaEngine,
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
      throw new Error(`rolling window quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling window quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling window quota ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRollingWindowQuotaCoordinator(store: RollingWindowQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingWindowQuotaCoordinator {
  return new RollingWindowQuotaCoordinator(
    store,
    defaultRollingWindowQuotaValidator(),
    clockValue,
    [],
    defaultRollingWindowQuotaEngine(flagsValue),
  );
}
