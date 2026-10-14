import * as clock from "../../../../kit/clock.js";
import { ActivationTargetEngine, defaultActivationTargetEngine } from "./activation-target-engine.js";
import { ActivationTargetValidator, defaultActivationTargetValidator } from "./activation-target-rules.js";
import { ActivationTargetStore } from "./activation-target-store.js";

/** Moves activation targets through their life cycle and keeps a journal of what it did. */
export class ActivationTargetWorkflow {
  store: ActivationTargetStore;
  validator: ActivationTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationTargetEngine;

  constructor(
    store: ActivationTargetStore,
    validator: ActivationTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationTargetEngine,
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
      throw new Error(`activation target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation target ${code} not found`);
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

export function newActivationTargetWorkflow(store: ActivationTargetStore, clockValue: clock.Clock): ActivationTargetWorkflow {
  return new ActivationTargetWorkflow(
    store,
    defaultActivationTargetValidator(),
    clockValue,
    [],
    defaultActivationTargetEngine(),
  );
}
