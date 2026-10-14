import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackJourneyClaimEngine, defaultFallbackJourneyClaimEngine } from "./fallback-journey-claim-engine.js";
import {
  FallbackJourneyClaimValidator,
  defaultFallbackJourneyClaimValidator,
} from "./fallback-journey-claim-rules.js";
import { FallbackJourneyClaimStore } from "./fallback-journey-claim-store.js";

/** Moves fallback journey claims through their life cycle and keeps a journal of what it did. */
export class FallbackJourneyClaimService {
  store: FallbackJourneyClaimStore;
  validator: FallbackJourneyClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackJourneyClaimEngine;

  constructor(
    store: FallbackJourneyClaimStore,
    validator: FallbackJourneyClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackJourneyClaimEngine,
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
      throw new Error(`fallback journey claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback journey claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback journey claim ${code} not found`);
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

export function newFallbackJourneyClaimService(store: FallbackJourneyClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackJourneyClaimService {
  return new FallbackJourneyClaimService(
    store,
    defaultFallbackJourneyClaimValidator(),
    clockValue,
    [],
    defaultFallbackJourneyClaimEngine(flagsValue),
  );
}
