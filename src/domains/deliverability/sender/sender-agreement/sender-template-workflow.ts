import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SenderTemplateEngine, defaultSenderTemplateEngine } from "./sender-template-engine.js";
import { SenderTemplateValidator, defaultSenderTemplateValidator } from "./sender-template-rules.js";
import { SenderTemplateStore } from "./sender-template-store.js";

/** Moves sender templates through their life cycle and keeps a journal of what it did. */
export class SenderTemplateDesk {
  store: SenderTemplateStore;
  validator: SenderTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SenderTemplateEngine;

  constructor(
    store: SenderTemplateStore,
    validator: SenderTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SenderTemplateEngine,
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
      throw new Error(`sender template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender template ${code} not found`);
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

export function newSenderTemplateDesk(store: SenderTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): SenderTemplateDesk {
  return new SenderTemplateDesk(
    store,
    defaultSenderTemplateValidator(),
    clockValue,
    [],
    defaultSenderTemplateEngine(flagsValue),
  );
}
