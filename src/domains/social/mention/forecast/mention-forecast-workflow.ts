import * as clock from "../../../../kit/clock.js";
import { MentionForecastEngine, defaultMentionForecastEngine } from "./mention-forecast-engine.js";
import { MentionForecastValidator, defaultMentionForecastValidator } from "./mention-forecast-rules.js";
import { MentionForecastStore } from "./mention-forecast-store.js";

/** Moves mention forecasts through their life cycle and keeps a journal of what it did. */
export class MentionForecastService {
  store: MentionForecastStore;
  validator: MentionForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MentionForecastEngine;

  constructor(
    store: MentionForecastStore,
    validator: MentionForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MentionForecastEngine,
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
      throw new Error(`mention forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention forecast ${code} not found`);
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
      throw new Error(`mention forecast ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newMentionForecastService(store: MentionForecastStore, clockValue: clock.Clock): MentionForecastService {
  return new MentionForecastService(
    store,
    defaultMentionForecastValidator(),
    clockValue,
    [],
    defaultMentionForecastEngine(),
  );
}
