import * as clock from "../../../../kit/clock.js";
import { ScheduledSenderTargetEngine, defaultScheduledSenderTargetEngine } from "./scheduled-sender-target-engine.js";
import {
  ScheduledSenderTargetValidator,
  defaultScheduledSenderTargetValidator,
} from "./scheduled-sender-target-rules.js";
import { ScheduledSenderTargetStore } from "./scheduled-sender-target-store.js";

/** Moves scheduled sender targets through their life cycle and keeps a journal of what it did. */
export class ScheduledSenderTargetService {
  store: ScheduledSenderTargetStore;
  validator: ScheduledSenderTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledSenderTargetEngine;

  constructor(
    store: ScheduledSenderTargetStore,
    validator: ScheduledSenderTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledSenderTargetEngine,
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
      throw new Error(`scheduled sender target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled sender target ${code} not found`);
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
      throw new Error(`scheduled sender target ${code} not found`);
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

export function newScheduledSenderTargetService(store: ScheduledSenderTargetStore, clockValue: clock.Clock): ScheduledSenderTargetService {
  return new ScheduledSenderTargetService(
    store,
    defaultScheduledSenderTargetValidator(),
    clockValue,
    [],
    defaultScheduledSenderTargetEngine(),
  );
}
