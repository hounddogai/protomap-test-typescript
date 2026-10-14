import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalDeflectionCheckpointEngine,
  defaultGlobalDeflectionCheckpointEngine,
} from "./global-deflection-checkpoint-engine.js";
import {
  GlobalDeflectionCheckpointValidator,
  defaultGlobalDeflectionCheckpointValidator,
} from "./global-deflection-checkpoint-rules.js";
import { GlobalDeflectionCheckpointStore } from "./global-deflection-checkpoint-store.js";

/** Moves global deflection checkpoints through their life cycle and keeps a journal of what it did. */
export class GlobalDeflectionCheckpointDesk {
  store: GlobalDeflectionCheckpointStore;
  validator: GlobalDeflectionCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalDeflectionCheckpointEngine;

  constructor(
    store: GlobalDeflectionCheckpointStore,
    validator: GlobalDeflectionCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalDeflectionCheckpointEngine,
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
      throw new Error(`global deflection checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global deflection checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global deflection checkpoint ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newGlobalDeflectionCheckpointDesk(store: GlobalDeflectionCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalDeflectionCheckpointDesk {
  return new GlobalDeflectionCheckpointDesk(
    store,
    defaultGlobalDeflectionCheckpointValidator(),
    clockValue,
    [],
    defaultGlobalDeflectionCheckpointEngine(flagsValue),
  );
}
