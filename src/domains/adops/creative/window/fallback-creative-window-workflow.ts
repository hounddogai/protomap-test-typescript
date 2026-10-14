import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackCreativeWindowEngine,
  defaultFallbackCreativeWindowEngine,
} from "./fallback-creative-window-engine.js";
import {
  FallbackCreativeWindowValidator,
  defaultFallbackCreativeWindowValidator,
} from "./fallback-creative-window-rules.js";
import { FallbackCreativeWindowStore } from "./fallback-creative-window-store.js";

/** Moves fallback creative windows through their life cycle and keeps a journal of what it did. */
export class FallbackCreativeWindowWorkflow {
  store: FallbackCreativeWindowStore;
  validator: FallbackCreativeWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackCreativeWindowEngine;

  constructor(
    store: FallbackCreativeWindowStore,
    validator: FallbackCreativeWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackCreativeWindowEngine,
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
      throw new Error(`fallback creative window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback creative window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback creative window ${code} not found`);
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

export function newFallbackCreativeWindowWorkflow(store: FallbackCreativeWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackCreativeWindowWorkflow {
  return new FallbackCreativeWindowWorkflow(
    store,
    defaultFallbackCreativeWindowValidator(),
    clockValue,
    [],
    defaultFallbackCreativeWindowEngine(flagsValue),
  );
}
