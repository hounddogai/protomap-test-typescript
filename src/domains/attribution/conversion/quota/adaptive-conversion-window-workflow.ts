import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveConversionWindowEngine,
  defaultAdaptiveConversionWindowEngine,
} from "./adaptive-conversion-window-engine.js";
import {
  AdaptiveConversionWindowValidator,
  defaultAdaptiveConversionWindowValidator,
} from "./adaptive-conversion-window-rules.js";
import { AdaptiveConversionWindowStore } from "./adaptive-conversion-window-store.js";

/** Moves adaptive conversion windows through their life cycle and keeps a journal of what it did. */
export class AdaptiveConversionWindowDesk {
  store: AdaptiveConversionWindowStore;
  validator: AdaptiveConversionWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveConversionWindowEngine;

  constructor(
    store: AdaptiveConversionWindowStore,
    validator: AdaptiveConversionWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveConversionWindowEngine,
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
      throw new Error(`adaptive conversion window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive conversion window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive conversion window ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveConversionWindowDesk(store: AdaptiveConversionWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveConversionWindowDesk {
  return new AdaptiveConversionWindowDesk(
    store,
    defaultAdaptiveConversionWindowValidator(),
    clockValue,
    [],
    defaultAdaptiveConversionWindowEngine(flagsValue),
  );
}
