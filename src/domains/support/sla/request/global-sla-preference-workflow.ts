import * as clock from "../../../../kit/clock.js";
import { GlobalSlaPreferenceEngine, defaultGlobalSlaPreferenceEngine } from "./global-sla-preference-engine.js";
import { GlobalSlaPreferenceValidator, defaultGlobalSlaPreferenceValidator } from "./global-sla-preference-rules.js";
import { GlobalSlaPreferenceStore } from "./global-sla-preference-store.js";

/** Moves global sla preferences through their life cycle and keeps a journal of what it did. */
export class GlobalSlaPreferenceService {
  store: GlobalSlaPreferenceStore;
  validator: GlobalSlaPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalSlaPreferenceEngine;

  constructor(
    store: GlobalSlaPreferenceStore,
    validator: GlobalSlaPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalSlaPreferenceEngine,
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
      throw new Error(`global sla preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global sla preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global sla preference ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newGlobalSlaPreferenceService(store: GlobalSlaPreferenceStore, clockValue: clock.Clock): GlobalSlaPreferenceService {
  return new GlobalSlaPreferenceService(
    store,
    defaultGlobalSlaPreferenceValidator(),
    clockValue,
    [],
    defaultGlobalSlaPreferenceEngine(),
  );
}
