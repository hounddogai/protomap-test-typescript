import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyWindowSlotEngine, defaultLegacyWindowSlotEngine } from "./legacy-window-slot-engine.js";
import { LegacyWindowSlotValidator, defaultLegacyWindowSlotValidator } from "./legacy-window-slot-rules.js";
import { LegacyWindowSlotStore } from "./legacy-window-slot-store.js";

/** Moves legacy window slots through their life cycle and keeps a journal of what it did. */
export class LegacyWindowSlotWorkflow {
  store: LegacyWindowSlotStore;
  validator: LegacyWindowSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyWindowSlotEngine;

  constructor(
    store: LegacyWindowSlotStore,
    validator: LegacyWindowSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyWindowSlotEngine,
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
      throw new Error(`legacy window slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy window slot ${code} not found`);
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
      throw new Error(`legacy window slot ${code} not found`);
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

export function newLegacyWindowSlotWorkflow(store: LegacyWindowSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyWindowSlotWorkflow {
  return new LegacyWindowSlotWorkflow(
    store,
    defaultLegacyWindowSlotValidator(),
    clockValue,
    [],
    defaultLegacyWindowSlotEngine(flagsValue),
  );
}
