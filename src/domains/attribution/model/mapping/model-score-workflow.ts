import * as clock from "../../../../kit/clock.js";
import { ModelScoreValidator, defaultModelScoreValidator } from "./model-score-rules.js";
import { ModelScoreStore } from "./model-score-store.js";

/** Moves model scores through their life cycle and keeps a journal of what it did. */
export class ModelScoreDesk {
  store: ModelScoreStore;
  validator: ModelScoreValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: ModelScoreStore, validator: ModelScoreValidator, clockValue: clock.Clock, journal: string[]) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newModelScoreDesk(store: ModelScoreStore, clockValue: clock.Clock): ModelScoreDesk {
  return new ModelScoreDesk(store, defaultModelScoreValidator(), clockValue, []);
}
