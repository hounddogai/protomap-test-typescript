import * as clock from "../../../../kit/clock.js";
import {
  FallbackChallengeOverrideEngine,
  defaultFallbackChallengeOverrideEngine,
} from "./fallback-challenge-override-engine.js";
import {
  FallbackChallengeOverrideValidator,
  defaultFallbackChallengeOverrideValidator,
} from "./fallback-challenge-override-rules.js";
import { FallbackChallengeOverrideStore } from "./fallback-challenge-override-store.js";

/** Moves fallback challenge overrides through their life cycle and keeps a journal of what it did. */
export class FallbackChallengeOverrideWorkflow {
  store: FallbackChallengeOverrideStore;
  validator: FallbackChallengeOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackChallengeOverrideEngine;

  constructor(
    store: FallbackChallengeOverrideStore,
    validator: FallbackChallengeOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackChallengeOverrideEngine,
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
      throw new Error(`fallback challenge override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback challenge override ${code} not found`);
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
      throw new Error(`fallback challenge override ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newFallbackChallengeOverrideWorkflow(store: FallbackChallengeOverrideStore, clockValue: clock.Clock): FallbackChallengeOverrideWorkflow {
  return new FallbackChallengeOverrideWorkflow(
    store,
    defaultFallbackChallengeOverrideValidator(),
    clockValue,
    [],
    defaultFallbackChallengeOverrideEngine(),
  );
}
