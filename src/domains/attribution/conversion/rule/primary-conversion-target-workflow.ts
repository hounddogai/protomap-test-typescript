import * as clock from "../../../../kit/clock.js";
import {
  PrimaryConversionTargetEngine,
  defaultPrimaryConversionTargetEngine,
} from "./primary-conversion-target-engine.js";
import {
  PrimaryConversionTargetValidator,
  defaultPrimaryConversionTargetValidator,
} from "./primary-conversion-target-rules.js";
import { PrimaryConversionTargetStore } from "./primary-conversion-target-store.js";

/** Moves primary conversion targets through their life cycle and keeps a journal of what it did. */
export class PrimaryConversionTargetWorkflow {
  store: PrimaryConversionTargetStore;
  validator: PrimaryConversionTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryConversionTargetEngine;

  constructor(
    store: PrimaryConversionTargetStore,
    validator: PrimaryConversionTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryConversionTargetEngine,
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
      throw new Error(`primary conversion target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary conversion target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary conversion target ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPrimaryConversionTargetWorkflow(store: PrimaryConversionTargetStore, clockValue: clock.Clock): PrimaryConversionTargetWorkflow {
  return new PrimaryConversionTargetWorkflow(
    store,
    defaultPrimaryConversionTargetValidator(),
    clockValue,
    [],
    defaultPrimaryConversionTargetEngine(),
  );
}
