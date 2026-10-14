import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LenientQueuePolicyEngine, defaultLenientQueuePolicyEngine } from "./lenient-queue-policy-engine.js";
import { LenientQueuePolicyValidator, defaultLenientQueuePolicyValidator } from "./lenient-queue-policy-rules.js";
import { LenientQueuePolicyStore } from "./lenient-queue-policy-store.js";

/** Moves lenient queue policies through their life cycle and keeps a journal of what it did. */
export class LenientQueuePolicyService {
  store: LenientQueuePolicyStore;
  validator: LenientQueuePolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientQueuePolicyEngine;

  constructor(
    store: LenientQueuePolicyStore,
    validator: LenientQueuePolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientQueuePolicyEngine,
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
      throw new Error(`lenient queue policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient queue policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient queue policy ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientQueuePolicyService(store: LenientQueuePolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientQueuePolicyService {
  return new LenientQueuePolicyService(
    store,
    defaultLenientQueuePolicyValidator(),
    clockValue,
    [],
    defaultLenientQueuePolicyEngine(flagsValue),
  );
}
