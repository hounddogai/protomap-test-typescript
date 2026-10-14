import * as clock from "../../../../kit/clock.js";
import { GlobalBadgeBaselineEngine, defaultGlobalBadgeBaselineEngine } from "./global-badge-baseline-engine.js";
import { GlobalBadgeBaselineValidator, defaultGlobalBadgeBaselineValidator } from "./global-badge-baseline-rules.js";
import { GlobalBadgeBaselineStore } from "./global-badge-baseline-store.js";

/** Moves global badge baselines through their life cycle and keeps a journal of what it did. */
export class GlobalBadgeBaselineManager {
  store: GlobalBadgeBaselineStore;
  validator: GlobalBadgeBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalBadgeBaselineEngine;

  constructor(
    store: GlobalBadgeBaselineStore,
    validator: GlobalBadgeBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalBadgeBaselineEngine,
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
      throw new Error(`global badge baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global badge baseline ${code} not found`);
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
      throw new Error(`global badge baseline ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newGlobalBadgeBaselineManager(store: GlobalBadgeBaselineStore, clockValue: clock.Clock): GlobalBadgeBaselineManager {
  return new GlobalBadgeBaselineManager(
    store,
    defaultGlobalBadgeBaselineValidator(),
    clockValue,
    [],
    defaultGlobalBadgeBaselineEngine(),
  );
}
