import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictExitRuleCycleEngine, defaultStrictExitRuleCycleEngine } from "./strict-exit-rule-cycle-engine.js";
import { StrictExitRuleCycleValidator, defaultStrictExitRuleCycleValidator } from "./strict-exit-rule-cycle-rules.js";
import { StrictExitRuleCycleStore } from "./strict-exit-rule-cycle-store.js";

/** Moves strict exit rule cycles through their life cycle and keeps a journal of what it did. */
export class StrictExitRuleCycleManager {
  store: StrictExitRuleCycleStore;
  validator: StrictExitRuleCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictExitRuleCycleEngine;

  constructor(
    store: StrictExitRuleCycleStore,
    validator: StrictExitRuleCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictExitRuleCycleEngine,
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
      throw new Error(`strict exit rule cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict exit rule cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict exit rule cycle ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newStrictExitRuleCycleManager(store: StrictExitRuleCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictExitRuleCycleManager {
  return new StrictExitRuleCycleManager(
    store,
    defaultStrictExitRuleCycleValidator(),
    clockValue,
    [],
    defaultStrictExitRuleCycleEngine(flagsValue),
  );
}
