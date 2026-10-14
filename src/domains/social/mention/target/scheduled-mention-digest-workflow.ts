import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledMentionDigestEngine,
  defaultScheduledMentionDigestEngine,
} from "./scheduled-mention-digest-engine.js";
import {
  ScheduledMentionDigestValidator,
  defaultScheduledMentionDigestValidator,
} from "./scheduled-mention-digest-rules.js";
import { ScheduledMentionDigestStore } from "./scheduled-mention-digest-store.js";

/** Moves scheduled mention digests through their life cycle and keeps a journal of what it did. */
export class ScheduledMentionDigestCoordinator {
  store: ScheduledMentionDigestStore;
  validator: ScheduledMentionDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledMentionDigestEngine;

  constructor(
    store: ScheduledMentionDigestStore,
    validator: ScheduledMentionDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledMentionDigestEngine,
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
      throw new Error(`scheduled mention digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled mention digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled mention digest ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newScheduledMentionDigestCoordinator(store: ScheduledMentionDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledMentionDigestCoordinator {
  return new ScheduledMentionDigestCoordinator(
    store,
    defaultScheduledMentionDigestValidator(),
    clockValue,
    [],
    defaultScheduledMentionDigestEngine(flagsValue),
  );
}
