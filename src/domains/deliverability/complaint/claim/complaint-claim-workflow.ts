import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ComplaintClaimEngine, defaultComplaintClaimEngine } from "./complaint-claim-engine.js";
import { ComplaintClaimValidator, defaultComplaintClaimValidator } from "./complaint-claim-rules.js";
import { ComplaintClaimStore } from "./complaint-claim-store.js";

/** Moves complaint claims through their life cycle and keeps a journal of what it did. */
export class ComplaintClaimManager {
  store: ComplaintClaimStore;
  validator: ComplaintClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintClaimEngine;

  constructor(
    store: ComplaintClaimStore,
    validator: ComplaintClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintClaimEngine,
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
      throw new Error(`complaint claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint claim ${code} not found`);
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

export function newComplaintClaimManager(store: ComplaintClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): ComplaintClaimManager {
  return new ComplaintClaimManager(
    store,
    defaultComplaintClaimValidator(),
    clockValue,
    [],
    defaultComplaintClaimEngine(flagsValue),
  );
}
