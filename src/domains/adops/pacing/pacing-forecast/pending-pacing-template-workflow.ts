import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingPacingTemplateEngine, defaultPendingPacingTemplateEngine } from "./pending-pacing-template-engine.js";
import {
  PendingPacingTemplateValidator,
  defaultPendingPacingTemplateValidator,
} from "./pending-pacing-template-rules.js";
import { PendingPacingTemplateStore } from "./pending-pacing-template-store.js";

/** Moves pending pacing templates through their life cycle and keeps a journal of what it did. */
export class PendingPacingTemplateDesk {
  store: PendingPacingTemplateStore;
  validator: PendingPacingTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingPacingTemplateEngine;

  constructor(
    store: PendingPacingTemplateStore,
    validator: PendingPacingTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingPacingTemplateEngine,
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
      throw new Error(`pending pacing template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending pacing template ${code} not found`);
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
      throw new Error(`pending pacing template ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newPendingPacingTemplateDesk(store: PendingPacingTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingPacingTemplateDesk {
  return new PendingPacingTemplateDesk(
    store,
    defaultPendingPacingTemplateValidator(),
    clockValue,
    [],
    defaultPendingPacingTemplateEngine(flagsValue),
  );
}
