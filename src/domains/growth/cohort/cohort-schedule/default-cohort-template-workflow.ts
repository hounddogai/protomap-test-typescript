import * as clock from "../../../../kit/clock.js";
import { DefaultCohortTemplateEngine, defaultDefaultCohortTemplateEngine } from "./default-cohort-template-engine.js";
import {
  DefaultCohortTemplateValidator,
  defaultDefaultCohortTemplateValidator,
} from "./default-cohort-template-rules.js";
import { DefaultCohortTemplateStore } from "./default-cohort-template-store.js";

/** Moves default cohort templates through their life cycle and keeps a journal of what it did. */
export class DefaultCohortTemplateCoordinator {
  store: DefaultCohortTemplateStore;
  validator: DefaultCohortTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultCohortTemplateEngine;

  constructor(
    store: DefaultCohortTemplateStore,
    validator: DefaultCohortTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultCohortTemplateEngine,
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
      throw new Error(`default cohort template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default cohort template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default cohort template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newDefaultCohortTemplateCoordinator(store: DefaultCohortTemplateStore, clockValue: clock.Clock): DefaultCohortTemplateCoordinator {
  return new DefaultCohortTemplateCoordinator(
    store,
    defaultDefaultCohortTemplateValidator(),
    clockValue,
    [],
    defaultDefaultCohortTemplateEngine(),
  );
}
