import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingWarmupRuleEngine, defaultPendingWarmupRuleEngine } from "./pending-warmup-rule-engine.js";
import { PendingWarmupRuleValidator, defaultPendingWarmupRuleValidator } from "./pending-warmup-rule-rules.js";
import { PendingWarmupRuleStore } from "./pending-warmup-rule-store.js";

/** Moves pending warmup rules through their life cycle and keeps a journal of what it did. */
export class PendingWarmupRuleManager {
  store: PendingWarmupRuleStore;
  validator: PendingWarmupRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingWarmupRuleEngine;

  constructor(
    store: PendingWarmupRuleStore,
    validator: PendingWarmupRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingWarmupRuleEngine,
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
      throw new Error(`pending warmup rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending warmup rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending warmup rule ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newPendingWarmupRuleManager(store: PendingWarmupRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingWarmupRuleManager {
  return new PendingWarmupRuleManager(
    store,
    defaultPendingWarmupRuleValidator(),
    clockValue,
    [],
    defaultPendingWarmupRuleEngine(flagsValue),
  );
}
