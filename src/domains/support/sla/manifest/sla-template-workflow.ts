import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SlaTemplateEngine, defaultSlaTemplateEngine } from "./sla-template-engine.js";
import { SlaTemplateValidator, defaultSlaTemplateValidator } from "./sla-template-rules.js";
import { SlaTemplateStore } from "./sla-template-store.js";

/** Moves sla templates through their life cycle and keeps a journal of what it did. */
export class SlaTemplateManager {
  store: SlaTemplateStore;
  validator: SlaTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaTemplateEngine;

  constructor(
    store: SlaTemplateStore,
    validator: SlaTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaTemplateEngine,
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
      throw new Error(`sla template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSlaTemplateManager(store: SlaTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): SlaTemplateManager {
  return new SlaTemplateManager(
    store,
    defaultSlaTemplateValidator(),
    clockValue,
    [],
    defaultSlaTemplateEngine(flagsValue),
  );
}
