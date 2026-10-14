import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PostSlotEngine, defaultPostSlotEngine } from "./post-slot-engine.js";
import { PostSlotValidator, defaultPostSlotValidator } from "./post-slot-rules.js";
import { PostSlotStore } from "./post-slot-store.js";

/** Moves post slots through their life cycle and keeps a journal of what it did. */
export class PostSlotService {
  store: PostSlotStore;
  validator: PostSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostSlotEngine;

  constructor(
    store: PostSlotStore,
    validator: PostSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostSlotEngine,
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
      throw new Error(`post slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post slot ${code} not found`);
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
      throw new Error(`post slot ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPostSlotService(store: PostSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): PostSlotService {
  return new PostSlotService(store, defaultPostSlotValidator(), clockValue, [], defaultPostSlotEngine(flagsValue));
}
