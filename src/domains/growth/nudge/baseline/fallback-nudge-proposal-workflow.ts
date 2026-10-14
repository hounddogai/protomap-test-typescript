import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackNudgeProposalEngine, defaultFallbackNudgeProposalEngine } from "./fallback-nudge-proposal-engine.js";
import {
  FallbackNudgeProposalValidator,
  defaultFallbackNudgeProposalValidator,
} from "./fallback-nudge-proposal-rules.js";
import { FallbackNudgeProposalStore } from "./fallback-nudge-proposal-store.js";

/** Moves fallback nudge proposals through their life cycle and keeps a journal of what it did. */
export class FallbackNudgeProposalCoordinator {
  store: FallbackNudgeProposalStore;
  validator: FallbackNudgeProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackNudgeProposalEngine;

  constructor(
    store: FallbackNudgeProposalStore,
    validator: FallbackNudgeProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackNudgeProposalEngine,
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
      throw new Error(`fallback nudge proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback nudge proposal ${code} not found`);
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
      throw new Error(`fallback nudge proposal ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFallbackNudgeProposalCoordinator(store: FallbackNudgeProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackNudgeProposalCoordinator {
  return new FallbackNudgeProposalCoordinator(
    store,
    defaultFallbackNudgeProposalValidator(),
    clockValue,
    [],
    defaultFallbackNudgeProposalEngine(flagsValue),
  );
}
