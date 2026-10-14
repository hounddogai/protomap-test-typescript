import * as clock from "../../../../kit/clock.js";
import { FrequencyWindowEngine, defaultFrequencyWindowEngine } from "./frequency-window-engine.js";
import { FrequencyWindowValidator, defaultFrequencyWindowValidator } from "./frequency-window-rules.js";
import { FrequencyWindowStore } from "./frequency-window-store.js";

/** Moves frequency windows through their life cycle and keeps a journal of what it did. */
export class FrequencyWindowService {
  store: FrequencyWindowStore;
  validator: FrequencyWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyWindowEngine;

  constructor(
    store: FrequencyWindowStore,
    validator: FrequencyWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyWindowEngine,
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
      throw new Error(`frequency window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency window ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newFrequencyWindowService(store: FrequencyWindowStore, clockValue: clock.Clock): FrequencyWindowService {
  return new FrequencyWindowService(
    store,
    defaultFrequencyWindowValidator(),
    clockValue,
    [],
    defaultFrequencyWindowEngine(),
  );
}
