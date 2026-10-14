import * as clock from "../../../../kit/clock.js";
import { AdaptiveDomainGroupEngine, defaultAdaptiveDomainGroupEngine } from "./adaptive-domain-group-engine.js";
import { AdaptiveDomainGroupValidator, defaultAdaptiveDomainGroupValidator } from "./adaptive-domain-group-rules.js";
import { AdaptiveDomainGroupStore } from "./adaptive-domain-group-store.js";

/** Moves adaptive domain groups through their life cycle and keeps a journal of what it did. */
export class AdaptiveDomainGroupManager {
  store: AdaptiveDomainGroupStore;
  validator: AdaptiveDomainGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveDomainGroupEngine;

  constructor(
    store: AdaptiveDomainGroupStore,
    validator: AdaptiveDomainGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveDomainGroupEngine,
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
      throw new Error(`adaptive domain group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive domain group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive domain group ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveDomainGroupManager(store: AdaptiveDomainGroupStore, clockValue: clock.Clock): AdaptiveDomainGroupManager {
  return new AdaptiveDomainGroupManager(
    store,
    defaultAdaptiveDomainGroupValidator(),
    clockValue,
    [],
    defaultAdaptiveDomainGroupEngine(),
  );
}
