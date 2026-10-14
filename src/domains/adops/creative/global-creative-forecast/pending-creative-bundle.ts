import * as text from "../../../../kit/text.js";

/** Where a pending creative bundle is in its life cycle. */
export type PendingCreativeBundleStatus = "created" | "validated" | "published" | "retired";

/** One pending creative bundle, with what the planners need to act on it. */
export class PendingCreativeBundle {
  code: string;
  name: string;
  maximum: number;
  attributes: Map<string, string>;
  channel: string;
  status: PendingCreativeBundleStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    attributes: Map<string, string>,
    channel: string,
    status: PendingCreativeBundleStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.attributes = attributes;
    this.channel = channel;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingCreativeBundleStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published";
      case "validated":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingCreativeBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending creative bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.maximum;
  }

  copy(): PendingCreativeBundle {
    return new PendingCreativeBundle(this.code, this.name, this.maximum, this.attributes, this.channel, this.status);
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pending creative bundle in status created. */
export function newPendingCreativeBundle(code: string, name: string): PendingCreativeBundle {
  return new PendingCreativeBundle(code, name, 0, new Map<string, string>(), "", "created");
}
