import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultMacroOverrideEngine, defaultDefaultMacroOverrideEngine } from "./default-macro-override-engine.js";
import {
  DefaultMacroOverrideValidator,
  defaultDefaultMacroOverrideValidator,
} from "./default-macro-override-rules.js";
import { DefaultMacroOverrideStore } from "./default-macro-override-store.js";

/** Moves default macro overrides through their life cycle and keeps a journal of what it did. */
export class DefaultMacroOverrideCoordinator {
  store: DefaultMacroOverrideStore;
  validator: DefaultMacroOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultMacroOverrideEngine;

  constructor(
    store: DefaultMacroOverrideStore,
    validator: DefaultMacroOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultMacroOverrideEngine,
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
      throw new Error(`default macro override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default macro override ${code} not found`);
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
      throw new Error(`default macro override ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newDefaultMacroOverrideCoordinator(store: DefaultMacroOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultMacroOverrideCoordinator {
  return new DefaultMacroOverrideCoordinator(
    store,
    defaultDefaultMacroOverrideValidator(),
    clockValue,
    [],
    defaultDefaultMacroOverrideEngine(flagsValue),
  );
}
