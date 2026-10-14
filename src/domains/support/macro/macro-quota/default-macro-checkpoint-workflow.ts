import * as clock from "../../../../kit/clock.js";
import {
  DefaultMacroCheckpointValidator,
  defaultDefaultMacroCheckpointValidator,
} from "./default-macro-checkpoint-rules.js";
import { DefaultMacroCheckpointStore } from "./default-macro-checkpoint-store.js";

/** Moves default macro checkpoints through their life cycle and keeps a journal of what it did. */
export class DefaultMacroCheckpointManager {
  store: DefaultMacroCheckpointStore;
  validator: DefaultMacroCheckpointValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultMacroCheckpointStore,
    validator: DefaultMacroCheckpointValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default macro checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default macro checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultMacroCheckpointManager(store: DefaultMacroCheckpointStore, clockValue: clock.Clock): DefaultMacroCheckpointManager {
  return new DefaultMacroCheckpointManager(store, defaultDefaultMacroCheckpointValidator(), clockValue, []);
}
