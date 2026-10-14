import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultWindowReviewEngine, defaultDefaultWindowReviewEngine } from "./default-window-review-engine.js";
import { DefaultWindowReviewValidator, defaultDefaultWindowReviewValidator } from "./default-window-review-rules.js";
import { DefaultWindowReviewStore } from "./default-window-review-store.js";

/** Moves default window reviews through their life cycle and keeps a journal of what it did. */
export class DefaultWindowReviewManager {
  store: DefaultWindowReviewStore;
  validator: DefaultWindowReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultWindowReviewEngine;

  constructor(
    store: DefaultWindowReviewStore,
    validator: DefaultWindowReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultWindowReviewEngine,
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
      throw new Error(`default window review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default window review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default window review ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultWindowReviewManager(store: DefaultWindowReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultWindowReviewManager {
  return new DefaultWindowReviewManager(
    store,
    defaultDefaultWindowReviewValidator(),
    clockValue,
    [],
    defaultDefaultWindowReviewEngine(flagsValue),
  );
}
