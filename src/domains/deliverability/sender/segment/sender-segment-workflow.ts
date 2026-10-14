import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SenderSegmentEngine, defaultSenderSegmentEngine } from "./sender-segment-engine.js";
import { SenderSegmentValidator, defaultSenderSegmentValidator } from "./sender-segment-rules.js";
import { SenderSegmentStore } from "./sender-segment-store.js";

/** Moves sender segments through their life cycle and keeps a journal of what it did. */
export class SenderSegmentCoordinator {
  store: SenderSegmentStore;
  validator: SenderSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SenderSegmentEngine;

  constructor(
    store: SenderSegmentStore,
    validator: SenderSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SenderSegmentEngine,
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
      throw new Error(`sender segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender segment ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newSenderSegmentCoordinator(store: SenderSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): SenderSegmentCoordinator {
  return new SenderSegmentCoordinator(
    store,
    defaultSenderSegmentValidator(),
    clockValue,
    [],
    defaultSenderSegmentEngine(flagsValue),
  );
}
