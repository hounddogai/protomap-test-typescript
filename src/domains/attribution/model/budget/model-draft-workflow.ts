import * as clock from "../../../../kit/clock.js";
import { ModelDraftEngine, defaultModelDraftEngine } from "./model-draft-engine.js";
import { ModelDraftValidator, defaultModelDraftValidator } from "./model-draft-rules.js";
import { ModelDraftStore } from "./model-draft-store.js";

/** Moves model drafts through their life cycle and keeps a journal of what it did. */
export class ModelDraftCoordinator {
  store: ModelDraftStore;
  validator: ModelDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelDraftEngine;

  constructor(
    store: ModelDraftStore,
    validator: ModelDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelDraftEngine,
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
      throw new Error(`model draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model draft ${code} not found`);
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
      throw new Error(`model draft ${code} not found`);
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

export function newModelDraftCoordinator(store: ModelDraftStore, clockValue: clock.Clock): ModelDraftCoordinator {
  return new ModelDraftCoordinator(store, defaultModelDraftValidator(), clockValue, [], defaultModelDraftEngine());
}
