import * as clock from "../../../../kit/clock.js";
import { TouchpointTemplateValidator, defaultTouchpointTemplateValidator } from "./touchpoint-template-rules.js";
import { TouchpointTemplateStore } from "./touchpoint-template-store.js";

/** Moves touchpoint templates through their life cycle and keeps a journal of what it did. */
export class TouchpointTemplateManager {
  store: TouchpointTemplateStore;
  validator: TouchpointTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TouchpointTemplateStore,
    validator: TouchpointTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newTouchpointTemplateManager(store: TouchpointTemplateStore, clockValue: clock.Clock): TouchpointTemplateManager {
  return new TouchpointTemplateManager(store, defaultTouchpointTemplateValidator(), clockValue, []);
}
