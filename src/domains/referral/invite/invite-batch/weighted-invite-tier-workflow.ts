import * as clock from "../../../../kit/clock.js";
import { WeightedInviteTierEngine, defaultWeightedInviteTierEngine } from "./weighted-invite-tier-engine.js";
import { WeightedInviteTierValidator, defaultWeightedInviteTierValidator } from "./weighted-invite-tier-rules.js";
import { WeightedInviteTierStore } from "./weighted-invite-tier-store.js";

/** Moves weighted invite tiers through their life cycle and keeps a journal of what it did. */
export class WeightedInviteTierWorkflow {
  store: WeightedInviteTierStore;
  validator: WeightedInviteTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedInviteTierEngine;

  constructor(
    store: WeightedInviteTierStore,
    validator: WeightedInviteTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedInviteTierEngine,
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
      throw new Error(`weighted invite tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted invite tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted invite tier ${code} not found`);
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

export function newWeightedInviteTierWorkflow(store: WeightedInviteTierStore, clockValue: clock.Clock): WeightedInviteTierWorkflow {
  return new WeightedInviteTierWorkflow(
    store,
    defaultWeightedInviteTierValidator(),
    clockValue,
    [],
    defaultWeightedInviteTierEngine(),
  );
}
