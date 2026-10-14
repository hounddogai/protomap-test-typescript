import * as clock from "../../../../kit/clock.js";
import { BadgeMappingEngine, defaultBadgeMappingEngine } from "./badge-mapping-engine.js";
import { BadgeMappingValidator, defaultBadgeMappingValidator } from "./badge-mapping-rules.js";
import { BadgeMappingStore } from "./badge-mapping-store.js";

/** Moves badge mappings through their life cycle and keeps a journal of what it did. */
export class BadgeMappingService {
  store: BadgeMappingStore;
  validator: BadgeMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BadgeMappingEngine;

  constructor(
    store: BadgeMappingStore,
    validator: BadgeMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BadgeMappingEngine,
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
      throw new Error(`badge mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`badge mapping ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newBadgeMappingService(store: BadgeMappingStore, clockValue: clock.Clock): BadgeMappingService {
  return new BadgeMappingService(store, defaultBadgeMappingValidator(), clockValue, [], defaultBadgeMappingEngine());
}
