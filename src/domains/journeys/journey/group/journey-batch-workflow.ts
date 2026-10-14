import * as clock from "../../../../kit/clock.js";
import { JourneyBatchEngine, defaultJourneyBatchEngine } from "./journey-batch-engine.js";
import { JourneyBatchValidator, defaultJourneyBatchValidator } from "./journey-batch-rules.js";
import { JourneyBatchStore } from "./journey-batch-store.js";

/** Moves journey batches through their life cycle and keeps a journal of what it did. */
export class JourneyBatchService {
  store: JourneyBatchStore;
  validator: JourneyBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: JourneyBatchEngine;

  constructor(
    store: JourneyBatchStore,
    validator: JourneyBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: JourneyBatchEngine,
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
      throw new Error(`journey batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey batch ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newJourneyBatchService(store: JourneyBatchStore, clockValue: clock.Clock): JourneyBatchService {
  return new JourneyBatchService(store, defaultJourneyBatchValidator(), clockValue, [], defaultJourneyBatchEngine());
}
