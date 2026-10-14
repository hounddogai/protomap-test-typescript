import * as clock from "../../../../kit/clock.js";
import { RetentionCheckpointValidator, defaultRetentionCheckpointValidator } from "./retention-checkpoint-rules.js";
import { RetentionCheckpointStore } from "./retention-checkpoint-store.js";

/** Moves retention checkpoints through their life cycle and keeps a journal of what it did. */
export class RetentionCheckpointWorkflow {
  store: RetentionCheckpointStore;
  validator: RetentionCheckpointValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RetentionCheckpointStore,
    validator: RetentionCheckpointValidator,
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
      throw new Error(`retention checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRetentionCheckpointWorkflow(store: RetentionCheckpointStore, clockValue: clock.Clock): RetentionCheckpointWorkflow {
  return new RetentionCheckpointWorkflow(store, defaultRetentionCheckpointValidator(), clockValue, []);
}
