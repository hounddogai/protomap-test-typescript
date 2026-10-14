import * as clock from "../../../../kit/clock.js";
import {
  ScheduledMacroTemplateEngine,
  defaultScheduledMacroTemplateEngine,
} from "./scheduled-macro-template-engine.js";
import {
  ScheduledMacroTemplateValidator,
  defaultScheduledMacroTemplateValidator,
} from "./scheduled-macro-template-rules.js";
import { ScheduledMacroTemplateStore } from "./scheduled-macro-template-store.js";

/** Moves scheduled macro templates through their life cycle and keeps a journal of what it did. */
export class ScheduledMacroTemplateCoordinator {
  store: ScheduledMacroTemplateStore;
  validator: ScheduledMacroTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledMacroTemplateEngine;

  constructor(
    store: ScheduledMacroTemplateStore,
    validator: ScheduledMacroTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledMacroTemplateEngine,
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
      throw new Error(`scheduled macro template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled macro template ${code} not found`);
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
      throw new Error(`scheduled macro template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newScheduledMacroTemplateCoordinator(store: ScheduledMacroTemplateStore, clockValue: clock.Clock): ScheduledMacroTemplateCoordinator {
  return new ScheduledMacroTemplateCoordinator(
    store,
    defaultScheduledMacroTemplateValidator(),
    clockValue,
    [],
    defaultScheduledMacroTemplateEngine(),
  );
}
