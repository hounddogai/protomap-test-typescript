import * as clock from "../../../../kit/clock.js";
import {
  PrimaryFrequencyWindowEngine,
  defaultPrimaryFrequencyWindowEngine,
} from "./primary-frequency-window-engine.js";
import {
  PrimaryFrequencyWindowValidator,
  defaultPrimaryFrequencyWindowValidator,
} from "./primary-frequency-window-rules.js";
import { PrimaryFrequencyWindowStore } from "./primary-frequency-window-store.js";

/** Moves primary frequency windows through their life cycle and keeps a journal of what it did. */
export class PrimaryFrequencyWindowManager {
  store: PrimaryFrequencyWindowStore;
  validator: PrimaryFrequencyWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryFrequencyWindowEngine;

  constructor(
    store: PrimaryFrequencyWindowStore,
    validator: PrimaryFrequencyWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryFrequencyWindowEngine,
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
      throw new Error(`primary frequency window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary frequency window ${code} not found`);
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
      throw new Error(`primary frequency window ${code} not found`);
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

export function newPrimaryFrequencyWindowManager(store: PrimaryFrequencyWindowStore, clockValue: clock.Clock): PrimaryFrequencyWindowManager {
  return new PrimaryFrequencyWindowManager(
    store,
    defaultPrimaryFrequencyWindowValidator(),
    clockValue,
    [],
    defaultPrimaryFrequencyWindowEngine(),
  );
}
