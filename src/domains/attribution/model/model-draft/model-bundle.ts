import * as text from "../../../../kit/text.js";

/** Where a model bundle is in its life cycle. */
export type ModelBundleStatus = "new" | "queued" | "running" | "done" | "failed";

/** One model bundle, with what the planners need to act on it. */
export class ModelBundle {
  code: string;
  label: string;
  timezone: string;
  pinned: boolean;
  sequence: number;
  archived: boolean;
  channel: string;
  status: ModelBundleStatus;

  constructor(
    code: string,
    label: string,
    timezone: string,
    pinned: boolean,
    sequence: number,
    archived: boolean,
    channel: string,
    status: ModelBundleStatus,
  ) {
    this.code = code;
    this.label = label;
    this.timezone = timezone;
    this.pinned = pinned;
    this.sequence = sequence;
    this.archived = archived;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: ModelBundleStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "done";
      case "queued":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: ModelBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"model bundle"} ${this.code}`;
  }

  measuredValue(): number {
    return this.sequence;
  }

  copy(): ModelBundle {
    return new ModelBundle(
      this.code,
      this.label,
      this.timezone,
      this.pinned,
      this.sequence,
      this.archived,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a model bundle in status new. */
export function newModelBundle(code: string, label: string): ModelBundle {
  return new ModelBundle(code, label, "", false, 0, false, "", "new");
}
