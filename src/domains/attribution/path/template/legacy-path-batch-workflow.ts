import * as clock from "../../../../kit/clock.js";
import { LegacyPathBatchEngine, defaultLegacyPathBatchEngine } from "./legacy-path-batch-engine.js";
import { LegacyPathBatchValidator, defaultLegacyPathBatchValidator } from "./legacy-path-batch-rules.js";
import { LegacyPathBatchStore } from "./legacy-path-batch-store.js";

/** Moves legacy path batches through their life cycle and keeps a journal of what it did. */
export class LegacyPathBatchDesk {
  store: LegacyPathBatchStore;
  validator: LegacyPathBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyPathBatchEngine;

  constructor(
    store: LegacyPathBatchStore,
    validator: LegacyPathBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyPathBatchEngine,
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
      throw new Error(`legacy path batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy path batch ${code} not found`);
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
      throw new Error(`legacy path batch ${code} not found`);
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

export function newLegacyPathBatchDesk(store: LegacyPathBatchStore, clockValue: clock.Clock): LegacyPathBatchDesk {
  return new LegacyPathBatchDesk(
    store,
    defaultLegacyPathBatchValidator(),
    clockValue,
    [],
    defaultLegacyPathBatchEngine(),
  );
}
