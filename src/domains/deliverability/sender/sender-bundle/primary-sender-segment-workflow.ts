import * as clock from "../../../../kit/clock.js";
import { PrimarySenderSegmentEngine, defaultPrimarySenderSegmentEngine } from "./primary-sender-segment-engine.js";
import {
  PrimarySenderSegmentValidator,
  defaultPrimarySenderSegmentValidator,
} from "./primary-sender-segment-rules.js";
import { PrimarySenderSegmentStore } from "./primary-sender-segment-store.js";

/** Moves primary sender segments through their life cycle and keeps a journal of what it did. */
export class PrimarySenderSegmentDesk {
  store: PrimarySenderSegmentStore;
  validator: PrimarySenderSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimarySenderSegmentEngine;

  constructor(
    store: PrimarySenderSegmentStore,
    validator: PrimarySenderSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimarySenderSegmentEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sender segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sender segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sender segment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newPrimarySenderSegmentDesk(store: PrimarySenderSegmentStore, clockValue: clock.Clock): PrimarySenderSegmentDesk {
  return new PrimarySenderSegmentDesk(
    store,
    defaultPrimarySenderSegmentValidator(),
    clockValue,
    [],
    defaultPrimarySenderSegmentEngine(),
  );
}
