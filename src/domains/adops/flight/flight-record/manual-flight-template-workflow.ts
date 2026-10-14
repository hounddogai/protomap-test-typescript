import * as clock from "../../../../kit/clock.js";
import { ManualFlightTemplateEngine, defaultManualFlightTemplateEngine } from "./manual-flight-template-engine.js";
import {
  ManualFlightTemplateValidator,
  defaultManualFlightTemplateValidator,
} from "./manual-flight-template-rules.js";
import { ManualFlightTemplateStore } from "./manual-flight-template-store.js";

/** Moves manual flight templates through their life cycle and keeps a journal of what it did. */
export class ManualFlightTemplateWorkflow {
  store: ManualFlightTemplateStore;
  validator: ManualFlightTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualFlightTemplateEngine;

  constructor(
    store: ManualFlightTemplateStore,
    validator: ManualFlightTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualFlightTemplateEngine,
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
      throw new Error(`manual flight template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual flight template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual flight template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newManualFlightTemplateWorkflow(store: ManualFlightTemplateStore, clockValue: clock.Clock): ManualFlightTemplateWorkflow {
  return new ManualFlightTemplateWorkflow(
    store,
    defaultManualFlightTemplateValidator(),
    clockValue,
    [],
    defaultManualFlightTemplateEngine(),
  );
}
