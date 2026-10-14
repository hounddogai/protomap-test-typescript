import * as clock from "../../../../kit/clock.js";
import {
  LenientDeflectionSegmentValidator,
  defaultLenientDeflectionSegmentValidator,
} from "./lenient-deflection-segment-rules.js";
import { LenientDeflectionSegmentStore } from "./lenient-deflection-segment-store.js";

/** Moves lenient deflection segments through their life cycle and keeps a journal of what it did. */
export class LenientDeflectionSegmentWorkflow {
  store: LenientDeflectionSegmentStore;
  validator: LenientDeflectionSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientDeflectionSegmentStore,
    validator: LenientDeflectionSegmentValidator,
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
      throw new Error(`lenient deflection segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient deflection segment ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientDeflectionSegmentWorkflow(store: LenientDeflectionSegmentStore, clockValue: clock.Clock): LenientDeflectionSegmentWorkflow {
  return new LenientDeflectionSegmentWorkflow(store, defaultLenientDeflectionSegmentValidator(), clockValue, []);
}
