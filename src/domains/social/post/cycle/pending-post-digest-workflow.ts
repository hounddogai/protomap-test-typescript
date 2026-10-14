import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingPostDigestEngine, defaultPendingPostDigestEngine } from "./pending-post-digest-engine.js";
import { PendingPostDigestValidator, defaultPendingPostDigestValidator } from "./pending-post-digest-rules.js";
import { PendingPostDigestStore } from "./pending-post-digest-store.js";

/** Moves pending post digests through their life cycle and keeps a journal of what it did. */
export class PendingPostDigestDesk {
  store: PendingPostDigestStore;
  validator: PendingPostDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingPostDigestEngine;

  constructor(
    store: PendingPostDigestStore,
    validator: PendingPostDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingPostDigestEngine,
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
      throw new Error(`pending post digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending post digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending post digest ${code} not found`);
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

export function newPendingPostDigestDesk(store: PendingPostDigestStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingPostDigestDesk {
  return new PendingPostDigestDesk(
    store,
    defaultPendingPostDigestValidator(),
    clockValue,
    [],
    defaultPendingPostDigestEngine(flagsValue),
  );
}
