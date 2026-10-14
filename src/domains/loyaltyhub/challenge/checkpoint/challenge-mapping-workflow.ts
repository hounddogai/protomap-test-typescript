import * as clock from "../../../../kit/clock.js";
import { ChallengeMappingEngine, defaultChallengeMappingEngine } from "./challenge-mapping-engine.js";
import { ChallengeMappingValidator, defaultChallengeMappingValidator } from "./challenge-mapping-rules.js";
import { ChallengeMappingStore } from "./challenge-mapping-store.js";

/** Moves challenge mappings through their life cycle and keeps a journal of what it did. */
export class ChallengeMappingCoordinator {
  store: ChallengeMappingStore;
  validator: ChallengeMappingValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ChallengeMappingEngine;

  constructor(
    store: ChallengeMappingStore,
    validator: ChallengeMappingValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ChallengeMappingEngine,
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
      throw new Error(`challenge mapping ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge mapping ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge mapping ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newChallengeMappingCoordinator(store: ChallengeMappingStore, clockValue: clock.Clock): ChallengeMappingCoordinator {
  return new ChallengeMappingCoordinator(
    store,
    defaultChallengeMappingValidator(),
    clockValue,
    [],
    defaultChallengeMappingEngine(),
  );
}
