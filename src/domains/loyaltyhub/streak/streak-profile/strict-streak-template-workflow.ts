import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictStreakTemplateEngine, defaultStrictStreakTemplateEngine } from "./strict-streak-template-engine.js";
import {
  StrictStreakTemplateValidator,
  defaultStrictStreakTemplateValidator,
} from "./strict-streak-template-rules.js";
import { StrictStreakTemplateStore } from "./strict-streak-template-store.js";

/** Moves strict streak templates through their life cycle and keeps a journal of what it did. */
export class StrictStreakTemplateDesk {
  store: StrictStreakTemplateStore;
  validator: StrictStreakTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictStreakTemplateEngine;

  constructor(
    store: StrictStreakTemplateStore,
    validator: StrictStreakTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictStreakTemplateEngine,
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
      throw new Error(`strict streak template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict streak template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict streak template ${code} not found`);
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

export function newStrictStreakTemplateDesk(store: StrictStreakTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictStreakTemplateDesk {
  return new StrictStreakTemplateDesk(
    store,
    defaultStrictStreakTemplateValidator(),
    clockValue,
    [],
    defaultStrictStreakTemplateEngine(flagsValue),
  );
}
