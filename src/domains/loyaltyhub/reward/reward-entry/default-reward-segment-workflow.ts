import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultRewardSegmentEngine, defaultDefaultRewardSegmentEngine } from "./default-reward-segment-engine.js";
import {
  DefaultRewardSegmentValidator,
  defaultDefaultRewardSegmentValidator,
} from "./default-reward-segment-rules.js";
import { DefaultRewardSegmentStore } from "./default-reward-segment-store.js";

/** Moves default reward segments through their life cycle and keeps a journal of what it did. */
export class DefaultRewardSegmentDesk {
  store: DefaultRewardSegmentStore;
  validator: DefaultRewardSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultRewardSegmentEngine;

  constructor(
    store: DefaultRewardSegmentStore,
    validator: DefaultRewardSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultRewardSegmentEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reward segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reward segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reward segment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newDefaultRewardSegmentDesk(store: DefaultRewardSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultRewardSegmentDesk {
  return new DefaultRewardSegmentDesk(
    store,
    defaultDefaultRewardSegmentValidator(),
    clockValue,
    [],
    defaultDefaultRewardSegmentEngine(flagsValue),
  );
}
