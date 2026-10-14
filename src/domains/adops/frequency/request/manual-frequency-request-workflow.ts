import * as clock from "../../../../kit/clock.js";
import {
  ManualFrequencyRequestEngine,
  defaultManualFrequencyRequestEngine,
} from "./manual-frequency-request-engine.js";
import {
  ManualFrequencyRequestValidator,
  defaultManualFrequencyRequestValidator,
} from "./manual-frequency-request-rules.js";
import { ManualFrequencyRequestStore } from "./manual-frequency-request-store.js";

/** Moves manual frequency requests through their life cycle and keeps a journal of what it did. */
export class ManualFrequencyRequestService {
  store: ManualFrequencyRequestStore;
  validator: ManualFrequencyRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualFrequencyRequestEngine;

  constructor(
    store: ManualFrequencyRequestStore,
    validator: ManualFrequencyRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualFrequencyRequestEngine,
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
      throw new Error(`manual frequency request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual frequency request ${code} not found`);
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
      throw new Error(`manual frequency request ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newManualFrequencyRequestService(store: ManualFrequencyRequestStore, clockValue: clock.Clock): ManualFrequencyRequestService {
  return new ManualFrequencyRequestService(
    store,
    defaultManualFrequencyRequestValidator(),
    clockValue,
    [],
    defaultManualFrequencyRequestEngine(),
  );
}
