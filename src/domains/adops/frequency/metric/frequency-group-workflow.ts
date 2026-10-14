import * as clock from "../../../../kit/clock.js";
import { FrequencyGroupEngine, defaultFrequencyGroupEngine } from "./frequency-group-engine.js";
import { FrequencyGroupValidator, defaultFrequencyGroupValidator } from "./frequency-group-rules.js";
import { FrequencyGroupStore } from "./frequency-group-store.js";

/** Moves frequency groups through their life cycle and keeps a journal of what it did. */
export class FrequencyGroupService {
  store: FrequencyGroupStore;
  validator: FrequencyGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyGroupEngine;

  constructor(
    store: FrequencyGroupStore,
    validator: FrequencyGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyGroupEngine,
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
      throw new Error(`frequency group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency group ${code} not found`);
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
      throw new Error(`frequency group ${code} not found`);
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

export function newFrequencyGroupService(store: FrequencyGroupStore, clockValue: clock.Clock): FrequencyGroupService {
  return new FrequencyGroupService(
    store,
    defaultFrequencyGroupValidator(),
    clockValue,
    [],
    defaultFrequencyGroupEngine(),
  );
}
