import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { QueueRuleEngine, defaultQueueRuleEngine } from "./queue-rule-engine.js";
import { QueueRuleValidator, defaultQueueRuleValidator } from "./queue-rule-rules.js";
import { QueueRuleStore } from "./queue-rule-store.js";

/** Moves queue rules through their life cycle and keeps a journal of what it did. */
export class QueueRuleCoordinator {
  store: QueueRuleStore;
  validator: QueueRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueueRuleEngine;

  constructor(
    store: QueueRuleStore,
    validator: QueueRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueueRuleEngine,
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
      throw new Error(`queue rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue rule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newQueueRuleCoordinator(store: QueueRuleStore, clockValue: clock.Clock, flagsValue: flags.Registry): QueueRuleCoordinator {
  return new QueueRuleCoordinator(
    store,
    defaultQueueRuleValidator(),
    clockValue,
    [],
    defaultQueueRuleEngine(flagsValue),
  );
}
