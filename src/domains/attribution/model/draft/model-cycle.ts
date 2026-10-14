import * as text from "../../../../kit/text.js";

/** Where a model cycle is in its life cycle. */
export type ModelCycleStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A model cycle as the model team keeps it. */
export class ModelCycle {
  code: string;
  name: string;
  startsAt: number;
  utmSource: string;
  priority: number;
  audienceId: string;
  createdAt: number;
  pinned: boolean;
  status: ModelCycleStatus;

  constructor(
    code: string,
    name: string,
    startsAt: number,
    utmSource: string,
    priority: number,
    audienceId: string,
    createdAt: number,
    pinned: boolean,
    status: ModelCycleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.startsAt = startsAt;
    this.utmSource = utmSource;
    this.priority = priority;
    this.audienceId = audienceId;
    this.createdAt = createdAt;
    this.pinned = pinned;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelCycleStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
          case "draining":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: ModelCycleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model cycle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netLoad(): number {
    return Math.round((this.priority + this.startsAt) * 100) / 100;
  }

  copy(): ModelCycle {
    return new ModelCycle(
      this.code,
      this.name,
      this.startsAt,
      this.utmSource,
      this.priority,
      this.audienceId,
      this.createdAt,
      this.pinned,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a model cycle in status idle. */
export function newModelCycle(code: string, name: string): ModelCycle {
  return new ModelCycle(code, name, 0, "", 0, "", 0, false, "idle");
}
