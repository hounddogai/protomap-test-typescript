import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  WeightedMentionProfileEngine,
  defaultWeightedMentionProfileEngine,
} from "./weighted-mention-profile-engine.js";
import {
  WeightedMentionProfileValidator,
  defaultWeightedMentionProfileValidator,
} from "./weighted-mention-profile-rules.js";
import { WeightedMentionProfileStore } from "./weighted-mention-profile-store.js";

/** Moves weighted mention profiles through their life cycle and keeps a journal of what it did. */
export class WeightedMentionProfileDesk {
  store: WeightedMentionProfileStore;
  validator: WeightedMentionProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedMentionProfileEngine;

  constructor(
    store: WeightedMentionProfileStore,
    validator: WeightedMentionProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedMentionProfileEngine,
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
      throw new Error(`weighted mention profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention profile ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newWeightedMentionProfileDesk(store: WeightedMentionProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedMentionProfileDesk {
  return new WeightedMentionProfileDesk(
    store,
    defaultWeightedMentionProfileValidator(),
    clockValue,
    [],
    defaultWeightedMentionProfileEngine(flagsValue),
  );
}
