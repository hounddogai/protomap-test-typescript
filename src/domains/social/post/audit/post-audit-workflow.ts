import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PostAuditEngine, defaultPostAuditEngine } from "./post-audit-engine.js";
import { PostAuditValidator, defaultPostAuditValidator } from "./post-audit-rules.js";
import { PostAuditStore } from "./post-audit-store.js";

/** Moves post audits through their life cycle and keeps a journal of what it did. */
export class PostAuditService {
  store: PostAuditStore;
  validator: PostAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostAuditEngine;

  constructor(
    store: PostAuditStore,
    validator: PostAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostAuditEngine,
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
      throw new Error(`post audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post audit ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPostAuditService(store: PostAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): PostAuditService {
  return new PostAuditService(store, defaultPostAuditValidator(), clockValue, [], defaultPostAuditEngine(flagsValue));
}
