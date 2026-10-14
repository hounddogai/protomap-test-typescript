import * as clock from "../../../../kit/clock.js";
import {
  PrimarySubscriptionSegmentEngine,
  defaultPrimarySubscriptionSegmentEngine,
} from "./primary-subscription-segment-engine.js";
import {
  PrimarySubscriptionSegmentValidator,
  defaultPrimarySubscriptionSegmentValidator,
} from "./primary-subscription-segment-rules.js";
import { PrimarySubscriptionSegmentStore } from "./primary-subscription-segment-store.js";

/** Moves primary subscription segments through their life cycle and keeps a journal of what it did. */
export class PrimarySubscriptionSegmentDesk {
  store: PrimarySubscriptionSegmentStore;
  validator: PrimarySubscriptionSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimarySubscriptionSegmentEngine;

  constructor(
    store: PrimarySubscriptionSegmentStore,
    validator: PrimarySubscriptionSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimarySubscriptionSegmentEngine,
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
      throw new Error(`primary subscription segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary subscription segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary subscription segment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimarySubscriptionSegmentDesk(store: PrimarySubscriptionSegmentStore, clockValue: clock.Clock): PrimarySubscriptionSegmentDesk {
  return new PrimarySubscriptionSegmentDesk(
    store,
    defaultPrimarySubscriptionSegmentValidator(),
    clockValue,
    [],
    defaultPrimarySubscriptionSegmentEngine(),
  );
}
