import * as clock from "../../../../kit/clock.js";
import { WindowSegmentEngine, defaultWindowSegmentEngine } from "./window-segment-engine.js";
import { WindowSegmentValidator, defaultWindowSegmentValidator } from "./window-segment-rules.js";
import { WindowSegmentStore } from "./window-segment-store.js";

/** Moves window segments through their life cycle and keeps a journal of what it did. */
export class WindowSegmentService {
  store: WindowSegmentStore;
  validator: WindowSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowSegmentEngine;

  constructor(
    store: WindowSegmentStore,
    validator: WindowSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowSegmentEngine,
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
      throw new Error(`window segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window segment ${code} not found`);
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
      throw new Error(`window segment ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newWindowSegmentService(store: WindowSegmentStore, clockValue: clock.Clock): WindowSegmentService {
  return new WindowSegmentService(store, defaultWindowSegmentValidator(), clockValue, [], defaultWindowSegmentEngine());
}
