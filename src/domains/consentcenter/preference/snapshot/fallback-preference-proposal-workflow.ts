import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackPreferenceProposalEngine,
  defaultFallbackPreferenceProposalEngine,
} from "./fallback-preference-proposal-engine.js";
import {
  FallbackPreferenceProposalValidator,
  defaultFallbackPreferenceProposalValidator,
} from "./fallback-preference-proposal-rules.js";
import { FallbackPreferenceProposalStore } from "./fallback-preference-proposal-store.js";

/** Moves fallback preference proposals through their life cycle and keeps a journal of what it did. */
export class FallbackPreferenceProposalWorkflow {
  store: FallbackPreferenceProposalStore;
  validator: FallbackPreferenceProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackPreferenceProposalEngine;

  constructor(
    store: FallbackPreferenceProposalStore,
    validator: FallbackPreferenceProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackPreferenceProposalEngine,
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
      throw new Error(`fallback preference proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback preference proposal ${code} not found`);
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
      throw new Error(`fallback preference proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackPreferenceProposalWorkflow(store: FallbackPreferenceProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackPreferenceProposalWorkflow {
  return new FallbackPreferenceProposalWorkflow(
    store,
    defaultFallbackPreferenceProposalValidator(),
    clockValue,
    [],
    defaultFallbackPreferenceProposalEngine(flagsValue),
  );
}
