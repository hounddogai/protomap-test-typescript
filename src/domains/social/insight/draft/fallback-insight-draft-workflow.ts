import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackInsightDraftEngine, defaultFallbackInsightDraftEngine } from "./fallback-insight-draft-engine.js";
import {
  FallbackInsightDraftValidator,
  defaultFallbackInsightDraftValidator,
} from "./fallback-insight-draft-rules.js";
import { FallbackInsightDraftStore } from "./fallback-insight-draft-store.js";

/** Moves fallback insight drafts through their life cycle and keeps a journal of what it did. */
export class FallbackInsightDraftDesk {
  store: FallbackInsightDraftStore;
  validator: FallbackInsightDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackInsightDraftEngine;

  constructor(
    store: FallbackInsightDraftStore,
    validator: FallbackInsightDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackInsightDraftEngine,
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
      throw new Error(`fallback insight draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback insight draft ${code} not found`);
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
      throw new Error(`fallback insight draft ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackInsightDraftDesk(store: FallbackInsightDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackInsightDraftDesk {
  return new FallbackInsightDraftDesk(
    store,
    defaultFallbackInsightDraftValidator(),
    clockValue,
    [],
    defaultFallbackInsightDraftEngine(flagsValue),
  );
}
