import * as clock from "../../../../kit/clock.js";
import { ReplyTemplateEngine, defaultReplyTemplateEngine } from "./reply-template-engine.js";
import { ReplyTemplateValidator, defaultReplyTemplateValidator } from "./reply-template-rules.js";
import { ReplyTemplateStore } from "./reply-template-store.js";

/** Moves reply templates through their life cycle and keeps a journal of what it did. */
export class ReplyTemplateCoordinator {
  store: ReplyTemplateStore;
  validator: ReplyTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyTemplateEngine;

  constructor(
    store: ReplyTemplateStore,
    validator: ReplyTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyTemplateEngine,
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
      throw new Error(`reply template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply template ${code} not found`);
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

export function newReplyTemplateCoordinator(store: ReplyTemplateStore, clockValue: clock.Clock): ReplyTemplateCoordinator {
  return new ReplyTemplateCoordinator(
    store,
    defaultReplyTemplateValidator(),
    clockValue,
    [],
    defaultReplyTemplateEngine(),
  );
}
