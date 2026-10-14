import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { QueueAuditEngine, defaultQueueAuditEngine } from "./queue-audit-engine.js";
import { QueueAuditValidator, defaultQueueAuditValidator } from "./queue-audit-rules.js";
import { QueueAuditStore } from "./queue-audit-store.js";

/** Moves queue audits through their life cycle and keeps a journal of what it did. */
export class QueueAuditService {
  store: QueueAuditStore;
  validator: QueueAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: QueueAuditEngine;

  constructor(
    store: QueueAuditStore,
    validator: QueueAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: QueueAuditEngine,
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
      throw new Error(`queue audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`queue audit ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newQueueAuditService(store: QueueAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): QueueAuditService {
  return new QueueAuditService(
    store,
    defaultQueueAuditValidator(),
    clockValue,
    [],
    defaultQueueAuditEngine(flagsValue),
  );
}
