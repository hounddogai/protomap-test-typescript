import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CohortTemplateEngine, defaultCohortTemplateEngine } from "./cohort-template-engine.js";
import { CohortTemplateValidator, defaultCohortTemplateValidator } from "./cohort-template-rules.js";
import { CohortTemplateStore } from "./cohort-template-store.js";

/** Moves cohort templates through their life cycle and keeps a journal of what it did. */
export class CohortTemplateDesk {
  store: CohortTemplateStore;
  validator: CohortTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortTemplateEngine;

  constructor(
    store: CohortTemplateStore,
    validator: CohortTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortTemplateEngine,
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
      throw new Error(`cohort template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort template ${code} not found`);
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
      throw new Error(`cohort template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCohortTemplateDesk(store: CohortTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): CohortTemplateDesk {
  return new CohortTemplateDesk(
    store,
    defaultCohortTemplateValidator(),
    clockValue,
    [],
    defaultCohortTemplateEngine(flagsValue),
  );
}
