import * as clock from "../../../../kit/clock.js";
import { JourneyOverrideEngine, defaultJourneyOverrideEngine } from "./journey-override-engine.js";
import { JourneyOverrideValidator, defaultJourneyOverrideValidator } from "./journey-override-rules.js";
import { JourneyOverrideStore } from "./journey-override-store.js";

/** Moves journey overrides through their life cycle and keeps a journal of what it did. */
export class JourneyOverrideManager {
  store: JourneyOverrideStore;
  validator: JourneyOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyOverrideEngine;

  constructor(
    store: JourneyOverrideStore,
    validator: JourneyOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyOverrideEngine,
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
      throw new Error(`journey override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey override ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newJourneyOverrideManager(store: JourneyOverrideStore, clockValue: clock.Clock): JourneyOverrideManager {
  return new JourneyOverrideManager(
    store,
    defaultJourneyOverrideValidator(),
    clockValue,
    [],
    defaultJourneyOverrideEngine(),
  );
}
