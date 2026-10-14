import * as clock from "../../../../kit/clock.js";
import { FrequencyTargetEngine, defaultFrequencyTargetEngine } from "./frequency-target-engine.js";
import { FrequencyTargetValidator, defaultFrequencyTargetValidator } from "./frequency-target-rules.js";
import { FrequencyTargetStore } from "./frequency-target-store.js";

/** Moves frequency targets through their life cycle and keeps a journal of what it did. */
export class FrequencyTargetCoordinator {
  store: FrequencyTargetStore;
  validator: FrequencyTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyTargetEngine;

  constructor(
    store: FrequencyTargetStore,
    validator: FrequencyTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyTargetEngine,
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
      throw new Error(`frequency target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency target ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newFrequencyTargetCoordinator(store: FrequencyTargetStore, clockValue: clock.Clock): FrequencyTargetCoordinator {
  return new FrequencyTargetCoordinator(
    store,
    defaultFrequencyTargetValidator(),
    clockValue,
    [],
    defaultFrequencyTargetEngine(),
  );
}
