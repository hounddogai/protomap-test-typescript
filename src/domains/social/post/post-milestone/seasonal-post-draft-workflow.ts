import * as clock from "../../../../kit/clock.js";
import { SeasonalPostDraftEngine, defaultSeasonalPostDraftEngine } from "./seasonal-post-draft-engine.js";
import { SeasonalPostDraftValidator, defaultSeasonalPostDraftValidator } from "./seasonal-post-draft-rules.js";
import { SeasonalPostDraftStore } from "./seasonal-post-draft-store.js";

/** Moves seasonal post drafts through their life cycle and keeps a journal of what it did. */
export class SeasonalPostDraftService {
  store: SeasonalPostDraftStore;
  validator: SeasonalPostDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalPostDraftEngine;

  constructor(
    store: SeasonalPostDraftStore,
    validator: SeasonalPostDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalPostDraftEngine,
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
      throw new Error(`seasonal post draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal post draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal post draft ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newSeasonalPostDraftService(store: SeasonalPostDraftStore, clockValue: clock.Clock): SeasonalPostDraftService {
  return new SeasonalPostDraftService(
    store,
    defaultSeasonalPostDraftValidator(),
    clockValue,
    [],
    defaultSeasonalPostDraftEngine(),
  );
}
