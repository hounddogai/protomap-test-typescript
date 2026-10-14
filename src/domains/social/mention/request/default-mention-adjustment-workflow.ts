import * as clock from "../../../../kit/clock.js";
import {
  DefaultMentionAdjustmentEngine,
  defaultDefaultMentionAdjustmentEngine,
} from "./default-mention-adjustment-engine.js";
import {
  DefaultMentionAdjustmentValidator,
  defaultDefaultMentionAdjustmentValidator,
} from "./default-mention-adjustment-rules.js";
import { DefaultMentionAdjustmentStore } from "./default-mention-adjustment-store.js";

/** Moves default mention adjustments through their life cycle and keeps a journal of what it did. */
export class DefaultMentionAdjustmentDesk {
  store: DefaultMentionAdjustmentStore;
  validator: DefaultMentionAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultMentionAdjustmentEngine;

  constructor(
    store: DefaultMentionAdjustmentStore,
    validator: DefaultMentionAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultMentionAdjustmentEngine,
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
      throw new Error(`default mention adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default mention adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default mention adjustment ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newDefaultMentionAdjustmentDesk(store: DefaultMentionAdjustmentStore, clockValue: clock.Clock): DefaultMentionAdjustmentDesk {
  return new DefaultMentionAdjustmentDesk(
    store,
    defaultDefaultMentionAdjustmentValidator(),
    clockValue,
    [],
    defaultDefaultMentionAdjustmentEngine(),
  );
}
