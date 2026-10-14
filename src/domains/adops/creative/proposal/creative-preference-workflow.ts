import * as clock from "../../../../kit/clock.js";
import { CreativePreferenceEngine, defaultCreativePreferenceEngine } from "./creative-preference-engine.js";
import { CreativePreferenceValidator, defaultCreativePreferenceValidator } from "./creative-preference-rules.js";
import { CreativePreferenceStore } from "./creative-preference-store.js";

/** Moves creative preferences through their life cycle and keeps a journal of what it did. */
export class CreativePreferenceDesk {
  store: CreativePreferenceStore;
  validator: CreativePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativePreferenceEngine;

  constructor(
    store: CreativePreferenceStore,
    validator: CreativePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativePreferenceEngine,
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
      throw new Error(`creative preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative preference ${code} not found`);
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

export function newCreativePreferenceDesk(store: CreativePreferenceStore, clockValue: clock.Clock): CreativePreferenceDesk {
  return new CreativePreferenceDesk(
    store,
    defaultCreativePreferenceValidator(),
    clockValue,
    [],
    defaultCreativePreferenceEngine(),
  );
}
