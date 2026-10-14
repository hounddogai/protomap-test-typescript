import * as clock from "../../../../kit/clock.js";
import { CreativeDraftEngine, defaultCreativeDraftEngine } from "./creative-draft-engine.js";
import { CreativeDraftValidator, defaultCreativeDraftValidator } from "./creative-draft-rules.js";
import { CreativeDraftStore } from "./creative-draft-store.js";

/** Moves creative drafts through their life cycle and keeps a journal of what it did. */
export class CreativeDraftManager {
  store: CreativeDraftStore;
  validator: CreativeDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeDraftEngine;

  constructor(
    store: CreativeDraftStore,
    validator: CreativeDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeDraftEngine,
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
      throw new Error(`creative draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative draft ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCreativeDraftManager(store: CreativeDraftStore, clockValue: clock.Clock): CreativeDraftManager {
  return new CreativeDraftManager(store, defaultCreativeDraftValidator(), clockValue, [], defaultCreativeDraftEngine());
}
