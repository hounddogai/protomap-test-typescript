import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryInsightProfileEngine, defaultPrimaryInsightProfileEngine } from "./primary-insight-profile-engine.js";
import {
  PrimaryInsightProfileValidator,
  defaultPrimaryInsightProfileValidator,
} from "./primary-insight-profile-rules.js";
import { PrimaryInsightProfileStore } from "./primary-insight-profile-store.js";

/** Moves primary insight profiles through their life cycle and keeps a journal of what it did. */
export class PrimaryInsightProfileService {
  store: PrimaryInsightProfileStore;
  validator: PrimaryInsightProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryInsightProfileEngine;

  constructor(
    store: PrimaryInsightProfileStore,
    validator: PrimaryInsightProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryInsightProfileEngine,
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
      throw new Error(`primary insight profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary insight profile ${code} not found`);
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
      throw new Error(`primary insight profile ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPrimaryInsightProfileService(store: PrimaryInsightProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryInsightProfileService {
  return new PrimaryInsightProfileService(
    store,
    defaultPrimaryInsightProfileValidator(),
    clockValue,
    [],
    defaultPrimaryInsightProfileEngine(flagsValue),
  );
}
