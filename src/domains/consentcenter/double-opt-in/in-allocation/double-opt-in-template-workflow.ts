import * as clock from "../../../../kit/clock.js";
import { DoubleOptInTemplateEngine, defaultDoubleOptInTemplateEngine } from "./double-opt-in-template-engine.js";
import { DoubleOptInTemplateValidator, defaultDoubleOptInTemplateValidator } from "./double-opt-in-template-rules.js";
import { DoubleOptInTemplateStore } from "./double-opt-in-template-store.js";

/** Moves double opt in templates through their life cycle and keeps a journal of what it did. */
export class DoubleOptInTemplateService {
  store: DoubleOptInTemplateStore;
  validator: DoubleOptInTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInTemplateEngine;

  constructor(
    store: DoubleOptInTemplateStore,
    validator: DoubleOptInTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInTemplateEngine,
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
      throw new Error(`double opt in template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in template ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newDoubleOptInTemplateService(store: DoubleOptInTemplateStore, clockValue: clock.Clock): DoubleOptInTemplateService {
  return new DoubleOptInTemplateService(
    store,
    defaultDoubleOptInTemplateValidator(),
    clockValue,
    [],
    defaultDoubleOptInTemplateEngine(),
  );
}
