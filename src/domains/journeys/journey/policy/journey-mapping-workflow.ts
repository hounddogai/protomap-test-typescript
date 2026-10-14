import * as clock from "../../../../kit/clock.js";
import { JourneyMappingEngine, defaultJourneyMappingEngine } from "./journey-mapping-engine.js";
import { JourneyMappingValidator, defaultJourneyMappingValidator } from "./journey-mapping-rules.js";
import { JourneyMappingStore } from "./journey-mapping-store.js";

/** Moves journey mappings through their life cycle and keeps a journal of what it did. */
export class JourneyMappingWorkflow {
  store: JourneyMappingStore;
  validator: JourneyMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyMappingEngine;

  constructor(
    store: JourneyMappingStore,
    validator: JourneyMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyMappingEngine,
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
      throw new Error(`journey mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey mapping ${code} not found`);
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

export function newJourneyMappingWorkflow(store: JourneyMappingStore, clockValue: clock.Clock): JourneyMappingWorkflow {
  return new JourneyMappingWorkflow(
    store,
    defaultJourneyMappingValidator(),
    clockValue,
    [],
    defaultJourneyMappingEngine(),
  );
}
