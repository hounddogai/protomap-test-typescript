import * as clock from "../../../../kit/clock.js";
import { ModelTemplateEngine, defaultModelTemplateEngine } from "./model-template-engine.js";
import { ModelTemplateValidator, defaultModelTemplateValidator } from "./model-template-rules.js";
import { ModelTemplateStore } from "./model-template-store.js";

/** Moves model templates through their life cycle and keeps a journal of what it did. */
export class ModelTemplateWorkflow {
  store: ModelTemplateStore;
  validator: ModelTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelTemplateEngine;

  constructor(
    store: ModelTemplateStore,
    validator: ModelTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelTemplateEngine,
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
      throw new Error(`model template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newModelTemplateWorkflow(store: ModelTemplateStore, clockValue: clock.Clock): ModelTemplateWorkflow {
  return new ModelTemplateWorkflow(
    store,
    defaultModelTemplateValidator(),
    clockValue,
    [],
    defaultModelTemplateEngine(),
  );
}
