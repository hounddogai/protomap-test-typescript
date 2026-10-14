import * as clock from "../../../../kit/clock.js";
import {
  ScheduledFrequencyClaimEngine,
  defaultScheduledFrequencyClaimEngine,
} from "./scheduled-frequency-claim-engine.js";
import {
  ScheduledFrequencyClaimValidator,
  defaultScheduledFrequencyClaimValidator,
} from "./scheduled-frequency-claim-rules.js";
import { ScheduledFrequencyClaimStore } from "./scheduled-frequency-claim-store.js";

/** Moves scheduled frequency claims through their life cycle and keeps a journal of what it did. */
export class ScheduledFrequencyClaimWorkflow {
  store: ScheduledFrequencyClaimStore;
  validator: ScheduledFrequencyClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFrequencyClaimEngine;

  constructor(
    store: ScheduledFrequencyClaimStore,
    validator: ScheduledFrequencyClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFrequencyClaimEngine,
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
      throw new Error(`scheduled frequency claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled frequency claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled frequency claim ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newScheduledFrequencyClaimWorkflow(store: ScheduledFrequencyClaimStore, clockValue: clock.Clock): ScheduledFrequencyClaimWorkflow {
  return new ScheduledFrequencyClaimWorkflow(
    store,
    defaultScheduledFrequencyClaimValidator(),
    clockValue,
    [],
    defaultScheduledFrequencyClaimEngine(),
  );
}
