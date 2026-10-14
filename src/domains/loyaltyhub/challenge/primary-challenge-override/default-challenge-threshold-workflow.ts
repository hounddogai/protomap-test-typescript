import * as clock from "../../../../kit/clock.js";
import {
  DefaultChallengeThresholdValidator,
  defaultDefaultChallengeThresholdValidator,
} from "./default-challenge-threshold-rules.js";
import { DefaultChallengeThresholdStore } from "./default-challenge-threshold-store.js";

/** Moves default challenge thresholds through their life cycle and keeps a journal of what it did. */
export class DefaultChallengeThresholdWorkflow {
  store: DefaultChallengeThresholdStore;
  validator: DefaultChallengeThresholdValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultChallengeThresholdStore,
    validator: DefaultChallengeThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default challenge threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default challenge threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newDefaultChallengeThresholdWorkflow(store: DefaultChallengeThresholdStore, clockValue: clock.Clock): DefaultChallengeThresholdWorkflow {
  return new DefaultChallengeThresholdWorkflow(store, defaultDefaultChallengeThresholdValidator(), clockValue, []);
}
