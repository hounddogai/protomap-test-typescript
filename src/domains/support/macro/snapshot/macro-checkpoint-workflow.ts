import * as clock from "../../../../kit/clock.js";
import { MacroCheckpointValidator, defaultMacroCheckpointValidator } from "./macro-checkpoint-rules.js";
import { MacroCheckpointStore } from "./macro-checkpoint-store.js";

/** Moves macro checkpoints through their life cycle and keeps a journal of what it did. */
export class MacroCheckpointCoordinator {
  store: MacroCheckpointStore;
  validator: MacroCheckpointValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: MacroCheckpointStore,
    validator: MacroCheckpointValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newMacroCheckpointCoordinator(store: MacroCheckpointStore, clockValue: clock.Clock): MacroCheckpointCoordinator {
  return new MacroCheckpointCoordinator(store, defaultMacroCheckpointValidator(), clockValue, []);
}
