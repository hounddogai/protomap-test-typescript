import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { MentionTemplateEngine, defaultMentionTemplateEngine } from "./mention-template-engine.js";
import { MentionTemplateValidator, defaultMentionTemplateValidator } from "./mention-template-rules.js";
import { MentionTemplateStore } from "./mention-template-store.js";

/** Moves mention templates through their life cycle and keeps a journal of what it did. */
export class MentionTemplateCoordinator {
  store: MentionTemplateStore;
  validator: MentionTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MentionTemplateEngine;

  constructor(
    store: MentionTemplateStore,
    validator: MentionTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MentionTemplateEngine,
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
      throw new Error(`mention template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`mention template ${code} not found`);
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
      throw new Error(`mention template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newMentionTemplateCoordinator(store: MentionTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): MentionTemplateCoordinator {
  return new MentionTemplateCoordinator(
    store,
    defaultMentionTemplateValidator(),
    clockValue,
    [],
    defaultMentionTemplateEngine(flagsValue),
  );
}
