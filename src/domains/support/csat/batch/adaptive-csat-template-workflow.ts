import * as clock from "../../../../kit/clock.js";
import { AdaptiveCsatTemplateEngine, defaultAdaptiveCsatTemplateEngine } from "./adaptive-csat-template-engine.js";
import {
  AdaptiveCsatTemplateValidator,
  defaultAdaptiveCsatTemplateValidator,
} from "./adaptive-csat-template-rules.js";
import { AdaptiveCsatTemplateStore } from "./adaptive-csat-template-store.js";

/** Moves adaptive csat templates through their life cycle and keeps a journal of what it did. */
export class AdaptiveCsatTemplateManager {
  store: AdaptiveCsatTemplateStore;
  validator: AdaptiveCsatTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveCsatTemplateEngine;

  constructor(
    store: AdaptiveCsatTemplateStore,
    validator: AdaptiveCsatTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveCsatTemplateEngine,
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
      throw new Error(`adaptive csat template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive csat template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive csat template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveCsatTemplateManager(store: AdaptiveCsatTemplateStore, clockValue: clock.Clock): AdaptiveCsatTemplateManager {
  return new AdaptiveCsatTemplateManager(
    store,
    defaultAdaptiveCsatTemplateValidator(),
    clockValue,
    [],
    defaultAdaptiveCsatTemplateEngine(),
  );
}
