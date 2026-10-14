import * as clock from "../../../../kit/clock.js";
import { PathRuleEngine, defaultPathRuleEngine } from "./path-rule-engine.js";
import { PathRuleValidator, defaultPathRuleValidator } from "./path-rule-rules.js";
import { PathRuleStore } from "./path-rule-store.js";

/** Moves path rules through their life cycle and keeps a journal of what it did. */
export class PathRuleCoordinator {
  store: PathRuleStore;
  validator: PathRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathRuleEngine;

  constructor(
    store: PathRuleStore,
    validator: PathRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathRuleEngine,
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
      throw new Error(`path rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path rule ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPathRuleCoordinator(store: PathRuleStore, clockValue: clock.Clock): PathRuleCoordinator {
  return new PathRuleCoordinator(store, defaultPathRuleValidator(), clockValue, [], defaultPathRuleEngine());
}
