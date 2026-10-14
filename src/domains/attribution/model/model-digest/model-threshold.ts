import * as text from "../../../../kit/text.js";

/** Where a model threshold is in its life cycle. */
export type ModelThresholdStatus = "new" | "queued" | "running" | "done" | "failed";

/** A model threshold. Its code is unique within a tenant. */
export class ModelThreshold {
  code: string;
  label: string;
  tags: string[];
  pinned: boolean;
  variant: string;
  quantity: number;
  status: ModelThresholdStatus;

  constructor(
    code: string,
    label: string,
    tags: string[],
    pinned: boolean,
    variant: string,
    quantity: number,
    status: ModelThresholdStatus,
  ) {
    this.code = code;
    this.label = label;
    this.tags = tags;
    this.pinned = pinned;
    this.variant = variant;
    this.quantity = quantity;
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

  canMoveTo(next: ModelThresholdStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ModelThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"model threshold"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ModelThreshold {
    return new ModelThreshold(this.code, this.label, this.tags, this.pinned, this.variant, this.quantity, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a model threshold in status new. */
export function newModelThreshold(code: string, label: string): ModelThreshold {
  return new ModelThreshold(code, label, [], false, "", 0, "new");
}
