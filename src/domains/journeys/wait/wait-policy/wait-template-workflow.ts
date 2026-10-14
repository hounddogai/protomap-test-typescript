import * as clock from "../../../../kit/clock.js";
import { WaitTemplateEngine, defaultWaitTemplateEngine } from "./wait-template-engine.js";
import { WaitTemplateValidator, defaultWaitTemplateValidator } from "./wait-template-rules.js";
import { WaitTemplateStore } from "./wait-template-store.js";

/** Moves wait templates through their life cycle and keeps a journal of what it did. */
export class WaitTemplateDesk {
  store: WaitTemplateStore;
  validator: WaitTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitTemplateEngine;

  constructor(
    store: WaitTemplateStore,
    validator: WaitTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitTemplateEngine,
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
      throw new Error(`wait template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait template ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWaitTemplateDesk(store: WaitTemplateStore, clockValue: clock.Clock): WaitTemplateDesk {
  return new WaitTemplateDesk(store, defaultWaitTemplateValidator(), clockValue, [], defaultWaitTemplateEngine());
}
