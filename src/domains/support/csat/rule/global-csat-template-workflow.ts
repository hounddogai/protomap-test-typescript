import * as clock from "../../../../kit/clock.js";
import { GlobalCsatTemplateEngine, defaultGlobalCsatTemplateEngine } from "./global-csat-template-engine.js";
import { GlobalCsatTemplateValidator, defaultGlobalCsatTemplateValidator } from "./global-csat-template-rules.js";
import { GlobalCsatTemplateStore } from "./global-csat-template-store.js";

/** Moves global csat templates through their life cycle and keeps a journal of what it did. */
export class GlobalCsatTemplateManager {
  store: GlobalCsatTemplateStore;
  validator: GlobalCsatTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalCsatTemplateEngine;

  constructor(
    store: GlobalCsatTemplateStore,
    validator: GlobalCsatTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalCsatTemplateEngine,
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
      throw new Error(`global csat template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global csat template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global csat template ${code} not found`);
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

export function newGlobalCsatTemplateManager(store: GlobalCsatTemplateStore, clockValue: clock.Clock): GlobalCsatTemplateManager {
  return new GlobalCsatTemplateManager(
    store,
    defaultGlobalCsatTemplateValidator(),
    clockValue,
    [],
    defaultGlobalCsatTemplateEngine(),
  );
}
