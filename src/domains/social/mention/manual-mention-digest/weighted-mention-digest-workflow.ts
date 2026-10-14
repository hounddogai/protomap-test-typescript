import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedMentionDigestEngine, defaultWeightedMentionDigestEngine } from "./weighted-mention-digest-engine.js";
import {
  WeightedMentionDigestValidator,
  defaultWeightedMentionDigestValidator,
} from "./weighted-mention-digest-rules.js";
import { WeightedMentionDigestStore } from "./weighted-mention-digest-store.js";

/** Moves weighted mention digests through their life cycle and keeps a journal of what it did. */
export class WeightedMentionDigestCoordinator {
  store: WeightedMentionDigestStore;
  validator: WeightedMentionDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedMentionDigestEngine;

  constructor(
    store: WeightedMentionDigestStore,
    validator: WeightedMentionDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedMentionDigestEngine,
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
      throw new Error(`weighted mention digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention digest ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newWeightedMentionDigestCoordinator(store: WeightedMentionDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedMentionDigestCoordinator {
  return new WeightedMentionDigestCoordinator(
    store,
    defaultWeightedMentionDigestValidator(),
    clockValue,
    [],
    defaultWeightedMentionDigestEngine(flagsValue),
  );
}
