import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalSenderScoreEngine, defaultRegionalSenderScoreEngine } from "./regional-sender-score-engine.js";
import { RegionalSenderScoreValidator, defaultRegionalSenderScoreValidator } from "./regional-sender-score-rules.js";
import { RegionalSenderScoreStore } from "./regional-sender-score-store.js";

/** Moves regional sender scores through their life cycle and keeps a journal of what it did. */
export class RegionalSenderScoreDesk {
  store: RegionalSenderScoreStore;
  validator: RegionalSenderScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalSenderScoreEngine;

  constructor(
    store: RegionalSenderScoreStore,
    validator: RegionalSenderScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalSenderScoreEngine,
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
      throw new Error(`regional sender score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sender score ${code} not found`);
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
      throw new Error(`regional sender score ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRegionalSenderScoreDesk(store: RegionalSenderScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalSenderScoreDesk {
  return new RegionalSenderScoreDesk(
    store,
    defaultRegionalSenderScoreValidator(),
    clockValue,
    [],
    defaultRegionalSenderScoreEngine(flagsValue),
  );
}
