import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultNudgeTierEngine, defaultDefaultNudgeTierEngine } from "./default-nudge-tier-engine.js";
import { DefaultNudgeTierValidator, defaultDefaultNudgeTierValidator } from "./default-nudge-tier-rules.js";
import { DefaultNudgeTierStore } from "./default-nudge-tier-store.js";

/** Moves default nudge tiers through their life cycle and keeps a journal of what it did. */
export class DefaultNudgeTierWorkflow {
  store: DefaultNudgeTierStore;
  validator: DefaultNudgeTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultNudgeTierEngine;

  constructor(
    store: DefaultNudgeTierStore,
    validator: DefaultNudgeTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultNudgeTierEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default nudge tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default nudge tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default nudge tier ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newDefaultNudgeTierWorkflow(store: DefaultNudgeTierStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultNudgeTierWorkflow {
  return new DefaultNudgeTierWorkflow(
    store,
    defaultDefaultNudgeTierValidator(),
    clockValue,
    [],
    defaultDefaultNudgeTierEngine(flagsValue),
  );
}
