import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RegionalChallengeProfileEngine,
  defaultRegionalChallengeProfileEngine,
} from "./regional-challenge-profile-engine.js";
import {
  RegionalChallengeProfileValidator,
  defaultRegionalChallengeProfileValidator,
} from "./regional-challenge-profile-rules.js";
import { RegionalChallengeProfileStore } from "./regional-challenge-profile-store.js";

/** Moves regional challenge profiles through their life cycle and keeps a journal of what it did. */
export class RegionalChallengeProfileDesk {
  store: RegionalChallengeProfileStore;
  validator: RegionalChallengeProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalChallengeProfileEngine;

  constructor(
    store: RegionalChallengeProfileStore,
    validator: RegionalChallengeProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalChallengeProfileEngine,
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
      throw new Error(`regional challenge profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional challenge profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional challenge profile ${code} not found`);
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

export function newRegionalChallengeProfileDesk(store: RegionalChallengeProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalChallengeProfileDesk {
  return new RegionalChallengeProfileDesk(
    store,
    defaultRegionalChallengeProfileValidator(),
    clockValue,
    [],
    defaultRegionalChallengeProfileEngine(flagsValue),
  );
}
