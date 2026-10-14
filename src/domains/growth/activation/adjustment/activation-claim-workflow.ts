import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ActivationClaimEngine, defaultActivationClaimEngine } from "./activation-claim-engine.js";
import { ActivationClaimValidator, defaultActivationClaimValidator } from "./activation-claim-rules.js";
import { ActivationClaimStore } from "./activation-claim-store.js";

/** Moves activation claims through their life cycle and keeps a journal of what it did. */
export class ActivationClaimService {
  store: ActivationClaimStore;
  validator: ActivationClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationClaimEngine;

  constructor(
    store: ActivationClaimStore,
    validator: ActivationClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationClaimEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation claim ${code} not found`);
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
      throw new Error(`activation claim ${code} not found`);
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

export function newActivationClaimService(store: ActivationClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): ActivationClaimService {
  return new ActivationClaimService(
    store,
    defaultActivationClaimValidator(),
    clockValue,
    [],
    defaultActivationClaimEngine(flagsValue),
  );
}
