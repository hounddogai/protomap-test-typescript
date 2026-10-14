import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LevelPolicyEngine, defaultLevelPolicyEngine } from "./level-policy-engine.js";
import { LevelPolicyValidator, defaultLevelPolicyValidator } from "./level-policy-rules.js";
import { LevelPolicyStore } from "./level-policy-store.js";

/** Moves level policies through their life cycle and keeps a journal of what it did. */
export class LevelPolicyWorkflow {
  store: LevelPolicyStore;
  validator: LevelPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelPolicyEngine;

  constructor(
    store: LevelPolicyStore,
    validator: LevelPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelPolicyEngine,
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
      throw new Error(`level policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level policy ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newLevelPolicyWorkflow(store: LevelPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): LevelPolicyWorkflow {
  return new LevelPolicyWorkflow(
    store,
    defaultLevelPolicyValidator(),
    clockValue,
    [],
    defaultLevelPolicyEngine(flagsValue),
  );
}
