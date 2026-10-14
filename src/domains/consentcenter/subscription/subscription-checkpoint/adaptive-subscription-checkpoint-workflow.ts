import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveSubscriptionCheckpointValidator,
  defaultAdaptiveSubscriptionCheckpointValidator,
} from "./adaptive-subscription-checkpoint-rules.js";
import { AdaptiveSubscriptionCheckpointStore } from "./adaptive-subscription-checkpoint-store.js";

/** Moves adaptive subscription checkpoints through their life cycle and keeps a journal of what it did. */
export class AdaptiveSubscriptionCheckpointCoordinator {
  store: AdaptiveSubscriptionCheckpointStore;
  validator: AdaptiveSubscriptionCheckpointValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveSubscriptionCheckpointStore,
    validator: AdaptiveSubscriptionCheckpointValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive subscription checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive subscription checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newAdaptiveSubscriptionCheckpointCoordinator(store: AdaptiveSubscriptionCheckpointStore, clockValue: clock.Clock): AdaptiveSubscriptionCheckpointCoordinator {
  return new AdaptiveSubscriptionCheckpointCoordinator(
    store,
    defaultAdaptiveSubscriptionCheckpointValidator(),
    clockValue,
    [],
  );
}
