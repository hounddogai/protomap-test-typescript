import * as clock from "../../../../kit/clock.js";
import {
  AdaptivePayoutAssignmentEngine,
  defaultAdaptivePayoutAssignmentEngine,
} from "./adaptive-payout-assignment-engine.js";
import {
  AdaptivePayoutAssignmentValidator,
  defaultAdaptivePayoutAssignmentValidator,
} from "./adaptive-payout-assignment-rules.js";
import { AdaptivePayoutAssignmentStore } from "./adaptive-payout-assignment-store.js";

/** Moves adaptive payout assignments through their life cycle and keeps a journal of what it did. */
export class AdaptivePayoutAssignmentService {
  store: AdaptivePayoutAssignmentStore;
  validator: AdaptivePayoutAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptivePayoutAssignmentEngine;

  constructor(
    store: AdaptivePayoutAssignmentStore,
    validator: AdaptivePayoutAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptivePayoutAssignmentEngine,
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
      throw new Error(`adaptive payout assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive payout assignment ${code} not found`);
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
      throw new Error(`adaptive payout assignment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptivePayoutAssignmentService(store: AdaptivePayoutAssignmentStore, clockValue: clock.Clock): AdaptivePayoutAssignmentService {
  return new AdaptivePayoutAssignmentService(
    store,
    defaultAdaptivePayoutAssignmentValidator(),
    clockValue,
    [],
    defaultAdaptivePayoutAssignmentEngine(),
  );
}
