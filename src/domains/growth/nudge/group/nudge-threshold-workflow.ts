import * as clock from "../../../../kit/clock.js";
import { NudgeThresholdValidator, defaultNudgeThresholdValidator } from "./nudge-threshold-rules.js";
import { NudgeThresholdStore } from "./nudge-threshold-store.js";

/** Moves nudge thresholds through their life cycle and keeps a journal of what it did. */
export class NudgeThresholdCoordinator {
  store: NudgeThresholdStore;
  validator: NudgeThresholdValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: NudgeThresholdStore,
    validator: NudgeThresholdValidator,
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
      throw new Error(`nudge threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newNudgeThresholdCoordinator(store: NudgeThresholdStore, clockValue: clock.Clock): NudgeThresholdCoordinator {
  return new NudgeThresholdCoordinator(store, defaultNudgeThresholdValidator(), clockValue, []);
}
