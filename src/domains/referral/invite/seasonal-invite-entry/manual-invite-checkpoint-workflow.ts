import * as clock from "../../../../kit/clock.js";
import {
  ManualInviteCheckpointEngine,
  defaultManualInviteCheckpointEngine,
} from "./manual-invite-checkpoint-engine.js";
import {
  ManualInviteCheckpointValidator,
  defaultManualInviteCheckpointValidator,
} from "./manual-invite-checkpoint-rules.js";
import { ManualInviteCheckpointStore } from "./manual-invite-checkpoint-store.js";

/** Moves manual invite checkpoints through their life cycle and keeps a journal of what it did. */
export class ManualInviteCheckpointCoordinator {
  store: ManualInviteCheckpointStore;
  validator: ManualInviteCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualInviteCheckpointEngine;

  constructor(
    store: ManualInviteCheckpointStore,
    validator: ManualInviteCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualInviteCheckpointEngine,
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
      throw new Error(`manual invite checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual invite checkpoint ${code} not found`);
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
      throw new Error(`manual invite checkpoint ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualInviteCheckpointCoordinator(store: ManualInviteCheckpointStore, clockValue: clock.Clock): ManualInviteCheckpointCoordinator {
  return new ManualInviteCheckpointCoordinator(
    store,
    defaultManualInviteCheckpointValidator(),
    clockValue,
    [],
    defaultManualInviteCheckpointEngine(),
  );
}
