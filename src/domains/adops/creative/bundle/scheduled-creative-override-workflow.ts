import * as clock from "../../../../kit/clock.js";
import {
  ScheduledCreativeOverrideEngine,
  defaultScheduledCreativeOverrideEngine,
} from "./scheduled-creative-override-engine.js";
import {
  ScheduledCreativeOverrideValidator,
  defaultScheduledCreativeOverrideValidator,
} from "./scheduled-creative-override-rules.js";
import { ScheduledCreativeOverrideStore } from "./scheduled-creative-override-store.js";

/** Moves scheduled creative overrides through their life cycle and keeps a journal of what it did. */
export class ScheduledCreativeOverrideWorkflow {
  store: ScheduledCreativeOverrideStore;
  validator: ScheduledCreativeOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledCreativeOverrideEngine;

  constructor(
    store: ScheduledCreativeOverrideStore,
    validator: ScheduledCreativeOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledCreativeOverrideEngine,
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
      throw new Error(`scheduled creative override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled creative override ${code} not found`);
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
      throw new Error(`scheduled creative override ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newScheduledCreativeOverrideWorkflow(store: ScheduledCreativeOverrideStore, clockValue: clock.Clock): ScheduledCreativeOverrideWorkflow {
  return new ScheduledCreativeOverrideWorkflow(
    store,
    defaultScheduledCreativeOverrideValidator(),
    clockValue,
    [],
    defaultScheduledCreativeOverrideEngine(),
  );
}
