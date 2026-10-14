import * as text from "../../../../kit/text.js";

/** Where a global deflection checkpoint is in its life cycle. */
export type GlobalDeflectionCheckpointStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** One global deflection checkpoint, with what the planners need to act on it. */
export class GlobalDeflectionCheckpoint {
  code: string;
  label: string;
  sendAt: number;
  ceiling: number;
  attributes: Map<string, string>;
  title: string;
  retries: number;
  unit: string;
  attempts: number;
  status: GlobalDeflectionCheckpointStatus;

  constructor(
    code: string,
    label: string,
    sendAt: number,
    ceiling: number,
    attributes: Map<string, string>,
    title: string,
    retries: number,
    unit: string,
    attempts: number,
    status: GlobalDeflectionCheckpointStatus,
  ) {
    this.code = code;
    this.label = label;
    this.sendAt = sendAt;
    this.ceiling = ceiling;
    this.attributes = attributes;
    this.title = title;
    this.retries = retries;
    this.unit = unit;
    this.attempts = attempts;
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

  canMoveTo(next: GlobalDeflectionCheckpointStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "warming":
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "stopped";
      case "ready":
        switch (next) {
          case "draining":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalDeflectionCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global deflection checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netVolume(): number {
    return Math.round((this.retries + this.sendAt) * 100) / 100;
  }

  copy(): GlobalDeflectionCheckpoint {
    return new GlobalDeflectionCheckpoint(
      this.code,
      this.label,
      this.sendAt,
      this.ceiling,
      this.attributes,
      this.title,
      this.retries,
      this.unit,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.unit);
  }
}

/** Starts a global deflection checkpoint in status idle. */
export function newGlobalDeflectionCheckpoint(code: string, label: string): GlobalDeflectionCheckpoint {
  return new GlobalDeflectionCheckpoint(code, label, 0, 0, new Map<string, string>(), "", 0, "", 0, "idle");
}
