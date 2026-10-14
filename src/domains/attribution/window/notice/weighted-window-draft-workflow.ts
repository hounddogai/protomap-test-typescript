import * as clock from "../../../../kit/clock.js";
import { WeightedWindowDraftEngine, defaultWeightedWindowDraftEngine } from "./weighted-window-draft-engine.js";
import { WeightedWindowDraftValidator, defaultWeightedWindowDraftValidator } from "./weighted-window-draft-rules.js";
import { WeightedWindowDraftStore } from "./weighted-window-draft-store.js";

/** Moves weighted window drafts through their life cycle and keeps a journal of what it did. */
export class WeightedWindowDraftWorkflow {
  store: WeightedWindowDraftStore;
  validator: WeightedWindowDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedWindowDraftEngine;

  constructor(
    store: WeightedWindowDraftStore,
    validator: WeightedWindowDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedWindowDraftEngine,
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
      throw new Error(`weighted window draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted window draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted window draft ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newWeightedWindowDraftWorkflow(store: WeightedWindowDraftStore, clockValue: clock.Clock): WeightedWindowDraftWorkflow {
  return new WeightedWindowDraftWorkflow(
    store,
    defaultWeightedWindowDraftValidator(),
    clockValue,
    [],
    defaultWeightedWindowDraftEngine(),
  );
}
