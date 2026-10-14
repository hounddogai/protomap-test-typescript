import * as clock from "../../../../kit/clock.js";
import {
  RegionalComplaintWindowEngine,
  defaultRegionalComplaintWindowEngine,
} from "./regional-complaint-window-engine.js";
import {
  RegionalComplaintWindowValidator,
  defaultRegionalComplaintWindowValidator,
} from "./regional-complaint-window-rules.js";
import { RegionalComplaintWindowStore } from "./regional-complaint-window-store.js";

/** Moves regional complaint windows through their life cycle and keeps a journal of what it did. */
export class RegionalComplaintWindowService {
  store: RegionalComplaintWindowStore;
  validator: RegionalComplaintWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalComplaintWindowEngine;

  constructor(
    store: RegionalComplaintWindowStore,
    validator: RegionalComplaintWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalComplaintWindowEngine,
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
      throw new Error(`regional complaint window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional complaint window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional complaint window ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRegionalComplaintWindowService(store: RegionalComplaintWindowStore, clockValue: clock.Clock): RegionalComplaintWindowService {
  return new RegionalComplaintWindowService(
    store,
    defaultRegionalComplaintWindowValidator(),
    clockValue,
    [],
    defaultRegionalComplaintWindowEngine(),
  );
}
