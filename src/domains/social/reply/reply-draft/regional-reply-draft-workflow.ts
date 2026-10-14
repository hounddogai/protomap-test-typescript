import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalReplyDraftEngine, defaultRegionalReplyDraftEngine } from "./regional-reply-draft-engine.js";
import { RegionalReplyDraftValidator, defaultRegionalReplyDraftValidator } from "./regional-reply-draft-rules.js";
import { RegionalReplyDraftStore } from "./regional-reply-draft-store.js";

/** Moves regional reply drafts through their life cycle and keeps a journal of what it did. */
export class RegionalReplyDraftService {
  store: RegionalReplyDraftStore;
  validator: RegionalReplyDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalReplyDraftEngine;

  constructor(
    store: RegionalReplyDraftStore,
    validator: RegionalReplyDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalReplyDraftEngine,
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
      throw new Error(`regional reply draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reply draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reply draft ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRegionalReplyDraftService(store: RegionalReplyDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalReplyDraftService {
  return new RegionalReplyDraftService(
    store,
    defaultRegionalReplyDraftValidator(),
    clockValue,
    [],
    defaultRegionalReplyDraftEngine(flagsValue),
  );
}
