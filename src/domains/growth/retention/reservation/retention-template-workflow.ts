import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionTemplateEngine, defaultRetentionTemplateEngine } from "./retention-template-engine.js";
import { RetentionTemplateValidator, defaultRetentionTemplateValidator } from "./retention-template-rules.js";
import { RetentionTemplateStore } from "./retention-template-store.js";

/** Moves retention templates through their life cycle and keeps a journal of what it did. */
export class RetentionTemplateService {
  store: RetentionTemplateStore;
  validator: RetentionTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionTemplateEngine;

  constructor(
    store: RetentionTemplateStore,
    validator: RetentionTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionTemplateEngine,
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
      throw new Error(`retention template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionTemplateService(store: RetentionTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionTemplateService {
  return new RetentionTemplateService(
    store,
    defaultRetentionTemplateValidator(),
    clockValue,
    [],
    defaultRetentionTemplateEngine(flagsValue),
  );
}
