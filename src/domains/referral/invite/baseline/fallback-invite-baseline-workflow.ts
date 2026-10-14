import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackInviteBaselineEngine,
  defaultFallbackInviteBaselineEngine,
} from "./fallback-invite-baseline-engine.js";
import {
  FallbackInviteBaselineValidator,
  defaultFallbackInviteBaselineValidator,
} from "./fallback-invite-baseline-rules.js";
import { FallbackInviteBaselineStore } from "./fallback-invite-baseline-store.js";

/** Moves fallback invite baselines through their life cycle and keeps a journal of what it did. */
export class FallbackInviteBaselineWorkflow {
  store: FallbackInviteBaselineStore;
  validator: FallbackInviteBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackInviteBaselineEngine;

  constructor(
    store: FallbackInviteBaselineStore,
    validator: FallbackInviteBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackInviteBaselineEngine,
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
      throw new Error(`fallback invite baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback invite baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback invite baseline ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newFallbackInviteBaselineWorkflow(store: FallbackInviteBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackInviteBaselineWorkflow {
  return new FallbackInviteBaselineWorkflow(
    store,
    defaultFallbackInviteBaselineValidator(),
    clockValue,
    [],
    defaultFallbackInviteBaselineEngine(flagsValue),
  );
}
