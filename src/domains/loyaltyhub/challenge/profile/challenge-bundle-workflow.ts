import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ChallengeBundleEngine, defaultChallengeBundleEngine } from "./challenge-bundle-engine.js";
import { ChallengeBundleValidator, defaultChallengeBundleValidator } from "./challenge-bundle-rules.js";
import { ChallengeBundleStore } from "./challenge-bundle-store.js";

/** Moves challenge bundles through their life cycle and keeps a journal of what it did. */
export class ChallengeBundleCoordinator {
  store: ChallengeBundleStore;
  validator: ChallengeBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeBundleEngine;

  constructor(
    store: ChallengeBundleStore,
    validator: ChallengeBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeBundleEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge bundle ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newChallengeBundleCoordinator(store: ChallengeBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ChallengeBundleCoordinator {
  return new ChallengeBundleCoordinator(
    store,
    defaultChallengeBundleValidator(),
    clockValue,
    [],
    defaultChallengeBundleEngine(flagsValue),
  );
}
