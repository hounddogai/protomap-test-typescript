import * as clock from "../../../../kit/clock.js";
import { StrictOptOutClaimEngine, defaultStrictOptOutClaimEngine } from "./strict-opt-out-claim-engine.js";
import { StrictOptOutClaimValidator, defaultStrictOptOutClaimValidator } from "./strict-opt-out-claim-rules.js";
import { StrictOptOutClaimStore } from "./strict-opt-out-claim-store.js";

/** Moves strict opt out claims through their life cycle and keeps a journal of what it did. */
export class StrictOptOutClaimManager {
  store: StrictOptOutClaimStore;
  validator: StrictOptOutClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictOptOutClaimEngine;

  constructor(
    store: StrictOptOutClaimStore,
    validator: StrictOptOutClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictOptOutClaimEngine,
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
      throw new Error(`strict opt out claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict opt out claim ${code} not found`);
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
      throw new Error(`strict opt out claim ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newStrictOptOutClaimManager(store: StrictOptOutClaimStore, clockValue: clock.Clock): StrictOptOutClaimManager {
  return new StrictOptOutClaimManager(
    store,
    defaultStrictOptOutClaimValidator(),
    clockValue,
    [],
    defaultStrictOptOutClaimEngine(),
  );
}
