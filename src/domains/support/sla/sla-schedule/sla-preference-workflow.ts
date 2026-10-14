import * as clock from "../../../../kit/clock.js";
import { SlaPreferenceEngine, defaultSlaPreferenceEngine } from "./sla-preference-engine.js";
import { SlaPreferenceValidator, defaultSlaPreferenceValidator } from "./sla-preference-rules.js";
import { SlaPreferenceStore } from "./sla-preference-store.js";

/** Moves sla preferences through their life cycle and keeps a journal of what it did. */
export class SlaPreferenceManager {
  store: SlaPreferenceStore;
  validator: SlaPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaPreferenceEngine;

  constructor(
    store: SlaPreferenceStore,
    validator: SlaPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaPreferenceEngine,
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
      throw new Error(`sla preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla preference ${code} not found`);
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
      throw new Error(`sla preference ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSlaPreferenceManager(store: SlaPreferenceStore, clockValue: clock.Clock): SlaPreferenceManager {
  return new SlaPreferenceManager(store, defaultSlaPreferenceValidator(), clockValue, [], defaultSlaPreferenceEngine());
}
