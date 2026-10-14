import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { OptOutTemplateEngine, defaultOptOutTemplateEngine } from "./opt-out-template-engine.js";
import { OptOutTemplateValidator, defaultOptOutTemplateValidator } from "./opt-out-template-rules.js";
import { OptOutTemplateStore } from "./opt-out-template-store.js";

/** Moves opt out templates through their life cycle and keeps a journal of what it did. */
export class OptOutTemplateManager {
  store: OptOutTemplateStore;
  validator: OptOutTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: OptOutTemplateEngine;

  constructor(
    store: OptOutTemplateStore,
    validator: OptOutTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: OptOutTemplateEngine,
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
      throw new Error(`opt out template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newOptOutTemplateManager(store: OptOutTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): OptOutTemplateManager {
  return new OptOutTemplateManager(
    store,
    defaultOptOutTemplateValidator(),
    clockValue,
    [],
    defaultOptOutTemplateEngine(flagsValue),
  );
}
