import * as clock from "../../../../kit/clock.js";
import { LenientWarmupDraftEngine, defaultLenientWarmupDraftEngine } from "./lenient-warmup-draft-engine.js";
import { LenientWarmupDraftValidator, defaultLenientWarmupDraftValidator } from "./lenient-warmup-draft-rules.js";
import { LenientWarmupDraftStore } from "./lenient-warmup-draft-store.js";

/** Moves lenient warmup drafts through their life cycle and keeps a journal of what it did. */
export class LenientWarmupDraftWorkflow {
  store: LenientWarmupDraftStore;
  validator: LenientWarmupDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientWarmupDraftEngine;

  constructor(
    store: LenientWarmupDraftStore,
    validator: LenientWarmupDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientWarmupDraftEngine,
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
      throw new Error(`lenient warmup draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup draft ${code} not found`);
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
      throw new Error(`lenient warmup draft ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newLenientWarmupDraftWorkflow(store: LenientWarmupDraftStore, clockValue: clock.Clock): LenientWarmupDraftWorkflow {
  return new LenientWarmupDraftWorkflow(
    store,
    defaultLenientWarmupDraftValidator(),
    clockValue,
    [],
    defaultLenientWarmupDraftEngine(),
  );
}
