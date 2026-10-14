import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalQueueRuleEngine, defaultRegionalQueueRuleEngine } from "./regional-queue-rule-engine.js";
import { RegionalQueueRuleValidator, defaultRegionalQueueRuleValidator } from "./regional-queue-rule-rules.js";
import { RegionalQueueRuleStore } from "./regional-queue-rule-store.js";

/** Moves regional queue rules through their life cycle and keeps a journal of what it did. */
export class RegionalQueueRuleService {
  store: RegionalQueueRuleStore;
  validator: RegionalQueueRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalQueueRuleEngine;

  constructor(
    store: RegionalQueueRuleStore,
    validator: RegionalQueueRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalQueueRuleEngine,
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
      throw new Error(`regional queue rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional queue rule ${code} not found`);
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
      throw new Error(`regional queue rule ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalQueueRuleService(store: RegionalQueueRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalQueueRuleService {
  return new RegionalQueueRuleService(
    store,
    defaultRegionalQueueRuleValidator(),
    clockValue,
    [],
    defaultRegionalQueueRuleEngine(flagsValue),
  );
}
