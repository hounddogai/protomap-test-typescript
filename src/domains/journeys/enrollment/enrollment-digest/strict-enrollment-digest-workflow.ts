import * as clock from "../../../../kit/clock.js";
import {
  StrictEnrollmentDigestEngine,
  defaultStrictEnrollmentDigestEngine,
} from "./strict-enrollment-digest-engine.js";
import {
  StrictEnrollmentDigestValidator,
  defaultStrictEnrollmentDigestValidator,
} from "./strict-enrollment-digest-rules.js";
import { StrictEnrollmentDigestStore } from "./strict-enrollment-digest-store.js";

/** Moves strict enrollment digests through their life cycle and keeps a journal of what it did. */
export class StrictEnrollmentDigestWorkflow {
  store: StrictEnrollmentDigestStore;
  validator: StrictEnrollmentDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictEnrollmentDigestEngine;

  constructor(
    store: StrictEnrollmentDigestStore,
    validator: StrictEnrollmentDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictEnrollmentDigestEngine,
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
      throw new Error(`strict enrollment digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict enrollment digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict enrollment digest ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictEnrollmentDigestWorkflow(store: StrictEnrollmentDigestStore, clockValue: clock.Clock): StrictEnrollmentDigestWorkflow {
  return new StrictEnrollmentDigestWorkflow(
    store,
    defaultStrictEnrollmentDigestValidator(),
    clockValue,
    [],
    defaultStrictEnrollmentDigestEngine(),
  );
}
