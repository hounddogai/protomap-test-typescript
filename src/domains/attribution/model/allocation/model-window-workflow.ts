import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ModelWindowEngine, defaultModelWindowEngine } from "./model-window-engine.js";
import { ModelWindowValidator, defaultModelWindowValidator } from "./model-window-rules.js";
import { ModelWindowStore } from "./model-window-store.js";

/** Moves model windows through their life cycle and keeps a journal of what it did. */
export class ModelWindowService {
  store: ModelWindowStore;
  validator: ModelWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelWindowEngine;

  constructor(
    store: ModelWindowStore,
    validator: ModelWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelWindowEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model window ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newModelWindowService(store: ModelWindowStore, clockValue: clock.Clock, flagsValue: flags.Registry): ModelWindowService {
  return new ModelWindowService(
    store,
    defaultModelWindowValidator(),
    clockValue,
    [],
    defaultModelWindowEngine(flagsValue),
  );
}
