import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReputationProfileEngine, defaultReputationProfileEngine } from "./reputation-profile-engine.js";
import { ReputationProfileValidator, defaultReputationProfileValidator } from "./reputation-profile-rules.js";
import { ReputationProfileStore } from "./reputation-profile-store.js";

/** Moves reputation profiles through their life cycle and keeps a journal of what it did. */
export class ReputationProfileDesk {
  store: ReputationProfileStore;
  validator: ReputationProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationProfileEngine;

  constructor(
    store: ReputationProfileStore,
    validator: ReputationProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationProfileEngine,
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
      throw new Error(`reputation profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation profile ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newReputationProfileDesk(store: ReputationProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReputationProfileDesk {
  return new ReputationProfileDesk(
    store,
    defaultReputationProfileValidator(),
    clockValue,
    [],
    defaultReputationProfileEngine(flagsValue),
  );
}
