import * as clock from "../../../../kit/clock.js";
import { ComplaintDigestEngine, defaultComplaintDigestEngine } from "./complaint-digest-engine.js";
import { ComplaintDigestValidator, defaultComplaintDigestValidator } from "./complaint-digest-rules.js";
import { ComplaintDigestStore } from "./complaint-digest-store.js";

/** Moves complaint digests through their life cycle and keeps a journal of what it did. */
export class ComplaintDigestWorkflow {
  store: ComplaintDigestStore;
  validator: ComplaintDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintDigestEngine;

  constructor(
    store: ComplaintDigestStore,
    validator: ComplaintDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintDigestEngine,
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
      throw new Error(`complaint digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint digest ${code} not found`);
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

export function newComplaintDigestWorkflow(store: ComplaintDigestStore, clockValue: clock.Clock): ComplaintDigestWorkflow {
  return new ComplaintDigestWorkflow(
    store,
    defaultComplaintDigestValidator(),
    clockValue,
    [],
    defaultComplaintDigestEngine(),
  );
}
