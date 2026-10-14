import * as clock from "../../../../kit/clock.js";
import { ConversionCycleEngine, defaultConversionCycleEngine } from "./conversion-cycle-engine.js";
import { ConversionCycleValidator, defaultConversionCycleValidator } from "./conversion-cycle-rules.js";
import { ConversionCycleStore } from "./conversion-cycle-store.js";

/** Moves conversion cycles through their life cycle and keeps a journal of what it did. */
export class ConversionCycleService {
  store: ConversionCycleStore;
  validator: ConversionCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ConversionCycleEngine;

  constructor(
    store: ConversionCycleStore,
    validator: ConversionCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ConversionCycleEngine,
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
      throw new Error(`conversion cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion cycle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newConversionCycleService(store: ConversionCycleStore, clockValue: clock.Clock): ConversionCycleService {
  return new ConversionCycleService(
    store,
    defaultConversionCycleValidator(),
    clockValue,
    [],
    defaultConversionCycleEngine(),
  );
}
