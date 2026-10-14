import * as clock from "../../../../kit/clock.js";
import { ModelRequestEngine, defaultModelRequestEngine } from "./model-request-engine.js";
import { ModelRequestValidator, defaultModelRequestValidator } from "./model-request-rules.js";
import { ModelRequestStore } from "./model-request-store.js";

/** Moves model requests through their life cycle and keeps a journal of what it did. */
export class ModelRequestManager {
  store: ModelRequestStore;
  validator: ModelRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelRequestEngine;

  constructor(
    store: ModelRequestStore,
    validator: ModelRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelRequestEngine,
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
      throw new Error(`model request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model request ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newModelRequestManager(store: ModelRequestStore, clockValue: clock.Clock): ModelRequestManager {
  return new ModelRequestManager(store, defaultModelRequestValidator(), clockValue, [], defaultModelRequestEngine());
}
