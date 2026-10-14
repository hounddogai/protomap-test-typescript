import * as clock from "../../../../kit/clock.js";
import { PacingRollupValidator, defaultPacingRollupValidator } from "./pacing-rollup-rules.js";
import { PacingRollupStore } from "./pacing-rollup-store.js";

/** Moves pacing rollups through their life cycle and keeps a journal of what it did. */
export class PacingRollupCoordinator {
  store: PacingRollupStore;
  validator: PacingRollupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PacingRollupStore,
    validator: PacingRollupValidator,
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
      throw new Error(`pacing rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newPacingRollupCoordinator(store: PacingRollupStore, clockValue: clock.Clock): PacingRollupCoordinator {
  return new PacingRollupCoordinator(store, defaultPacingRollupValidator(), clockValue, []);
}
