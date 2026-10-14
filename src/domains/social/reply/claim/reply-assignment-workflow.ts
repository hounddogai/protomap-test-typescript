import * as clock from "../../../../kit/clock.js";
import { ReplyAssignmentEngine, defaultReplyAssignmentEngine } from "./reply-assignment-engine.js";
import { ReplyAssignmentValidator, defaultReplyAssignmentValidator } from "./reply-assignment-rules.js";
import { ReplyAssignmentStore } from "./reply-assignment-store.js";

/** Moves reply assignments through their life cycle and keeps a journal of what it did. */
export class ReplyAssignmentWorkflow {
  store: ReplyAssignmentStore;
  validator: ReplyAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyAssignmentEngine;

  constructor(
    store: ReplyAssignmentStore,
    validator: ReplyAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyAssignmentEngine,
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
      throw new Error(`reply assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply assignment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newReplyAssignmentWorkflow(store: ReplyAssignmentStore, clockValue: clock.Clock): ReplyAssignmentWorkflow {
  return new ReplyAssignmentWorkflow(
    store,
    defaultReplyAssignmentValidator(),
    clockValue,
    [],
    defaultReplyAssignmentEngine(),
  );
}
