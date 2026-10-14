import * as clock from "../../../../kit/clock.js";
import {
  RollingPlacementExceptionValidator,
  defaultRollingPlacementExceptionValidator,
} from "./rolling-placement-exception-rules.js";
import { RollingPlacementExceptionStore } from "./rolling-placement-exception-store.js";

/** Moves rolling placement exceptions through their life cycle and keeps a journal of what it did. */
export class RollingPlacementExceptionService {
  store: RollingPlacementExceptionStore;
  validator: RollingPlacementExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingPlacementExceptionStore,
    validator: RollingPlacementExceptionValidator,
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
      throw new Error(`rolling placement exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling placement exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newRollingPlacementExceptionService(store: RollingPlacementExceptionStore, clockValue: clock.Clock): RollingPlacementExceptionService {
  return new RollingPlacementExceptionService(store, defaultRollingPlacementExceptionValidator(), clockValue, []);
}
