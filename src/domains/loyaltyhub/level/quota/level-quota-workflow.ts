import * as clock from "../../../../kit/clock.js";
import { LevelQuotaEngine, defaultLevelQuotaEngine } from "./level-quota-engine.js";
import { LevelQuotaValidator, defaultLevelQuotaValidator } from "./level-quota-rules.js";
import { LevelQuotaStore } from "./level-quota-store.js";

/** Moves level quotas through their life cycle and keeps a journal of what it did. */
export class LevelQuotaWorkflow {
  store: LevelQuotaStore;
  validator: LevelQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelQuotaEngine;

  constructor(
    store: LevelQuotaStore,
    validator: LevelQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelQuotaEngine,
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
      throw new Error(`level quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level quota ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLevelQuotaWorkflow(store: LevelQuotaStore, clockValue: clock.Clock): LevelQuotaWorkflow {
  return new LevelQuotaWorkflow(store, defaultLevelQuotaValidator(), clockValue, [], defaultLevelQuotaEngine());
}
