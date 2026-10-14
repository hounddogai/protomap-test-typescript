import * as clock from "../../../../kit/clock.js";
import { CappedStreakDigestEngine, defaultCappedStreakDigestEngine } from "./capped-streak-digest-engine.js";
import { CappedStreakDigestValidator, defaultCappedStreakDigestValidator } from "./capped-streak-digest-rules.js";
import { CappedStreakDigestStore } from "./capped-streak-digest-store.js";

/** Moves capped streak digests through their life cycle and keeps a journal of what it did. */
export class CappedStreakDigestService {
  store: CappedStreakDigestStore;
  validator: CappedStreakDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedStreakDigestEngine;

  constructor(
    store: CappedStreakDigestStore,
    validator: CappedStreakDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedStreakDigestEngine,
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
      throw new Error(`capped streak digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped streak digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped streak digest ${code} not found`);
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

export function newCappedStreakDigestService(store: CappedStreakDigestStore, clockValue: clock.Clock): CappedStreakDigestService {
  return new CappedStreakDigestService(
    store,
    defaultCappedStreakDigestValidator(),
    clockValue,
    [],
    defaultCappedStreakDigestEngine(),
  );
}
