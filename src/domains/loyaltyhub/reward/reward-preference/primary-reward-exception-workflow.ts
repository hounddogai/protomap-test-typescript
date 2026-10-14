import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PrimaryRewardExceptionEngine,
  defaultPrimaryRewardExceptionEngine,
} from "./primary-reward-exception-engine.js";
import {
  PrimaryRewardExceptionValidator,
  defaultPrimaryRewardExceptionValidator,
} from "./primary-reward-exception-rules.js";
import { PrimaryRewardExceptionStore } from "./primary-reward-exception-store.js";

/** Moves primary reward exceptions through their life cycle and keeps a journal of what it did. */
export class PrimaryRewardExceptionWorkflow {
  store: PrimaryRewardExceptionStore;
  validator: PrimaryRewardExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryRewardExceptionEngine;

  constructor(
    store: PrimaryRewardExceptionStore,
    validator: PrimaryRewardExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryRewardExceptionEngine,
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
      throw new Error(`primary reward exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary reward exception ${code} not found`);
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
      throw new Error(`primary reward exception ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newPrimaryRewardExceptionWorkflow(store: PrimaryRewardExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryRewardExceptionWorkflow {
  return new PrimaryRewardExceptionWorkflow(
    store,
    defaultPrimaryRewardExceptionValidator(),
    clockValue,
    [],
    defaultPrimaryRewardExceptionEngine(flagsValue),
  );
}
