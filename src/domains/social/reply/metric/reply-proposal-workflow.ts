import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyProposalEngine, defaultReplyProposalEngine } from "./reply-proposal-engine.js";
import { ReplyProposalValidator, defaultReplyProposalValidator } from "./reply-proposal-rules.js";
import { ReplyProposalStore } from "./reply-proposal-store.js";

/** Moves reply proposals through their life cycle and keeps a journal of what it did. */
export class ReplyProposalService {
  store: ReplyProposalStore;
  validator: ReplyProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyProposalEngine;

  constructor(
    store: ReplyProposalStore,
    validator: ReplyProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyProposalEngine,
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
      throw new Error(`reply proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply proposal ${code} not found`);
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

export function newReplyProposalService(store: ReplyProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyProposalService {
  return new ReplyProposalService(
    store,
    defaultReplyProposalValidator(),
    clockValue,
    [],
    defaultReplyProposalEngine(flagsValue),
  );
}
