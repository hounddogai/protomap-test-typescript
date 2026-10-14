import * as clock from "../../../../kit/clock.js";
import { WindowBatchEngine, defaultWindowBatchEngine } from "./window-batch-engine.js";
import { WindowBatchValidator, defaultWindowBatchValidator } from "./window-batch-rules.js";
import { WindowBatchStore } from "./window-batch-store.js";

/** Moves window batches through their life cycle and keeps a journal of what it did. */
export class WindowBatchService {
  store: WindowBatchStore;
  validator: WindowBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowBatchEngine;

  constructor(
    store: WindowBatchStore,
    validator: WindowBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowBatchEngine,
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
      throw new Error(`window batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window batch ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWindowBatchService(store: WindowBatchStore, clockValue: clock.Clock): WindowBatchService {
  return new WindowBatchService(store, defaultWindowBatchValidator(), clockValue, [], defaultWindowBatchEngine());
}
