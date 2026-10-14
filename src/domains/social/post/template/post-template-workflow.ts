import * as clock from "../../../../kit/clock.js";
import { PostTemplateEngine, defaultPostTemplateEngine } from "./post-template-engine.js";
import { PostTemplateValidator, defaultPostTemplateValidator } from "./post-template-rules.js";
import { PostTemplateStore } from "./post-template-store.js";

/** Moves post templates through their life cycle and keeps a journal of what it did. */
export class PostTemplateManager {
  store: PostTemplateStore;
  validator: PostTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostTemplateEngine;

  constructor(
    store: PostTemplateStore,
    validator: PostTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostTemplateEngine,
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
      throw new Error(`post template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPostTemplateManager(store: PostTemplateStore, clockValue: clock.Clock): PostTemplateManager {
  return new PostTemplateManager(store, defaultPostTemplateValidator(), clockValue, [], defaultPostTemplateEngine());
}
