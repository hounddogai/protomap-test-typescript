import * as text from "../../../../kit/text.js";

/** Where a pending sla override is in its life cycle. */
export type PendingSlaOverrideStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A pending sla override. Its code is unique within a tenant. */
export class PendingSlaOverride {
  code: string;
  name: string;
  category: string;
  attributes: Map<string, string>;
  floorValue: number;
  audienceId: string;
  status: PendingSlaOverrideStatus;

  constructor(
    code: string,
    name: string,
    category: string,
    attributes: Map<string, string>,
    floorValue: number,
    audienceId: string,
    status: PendingSlaOverrideStatus,
  ) {
    this.code = code;
    this.name = name;
    this.category = category;
    this.attributes = attributes;
    this.floorValue = floorValue;
    this.audienceId = audienceId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PendingSlaOverrideStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "suspended" || next === "closed";
      case "active":
        switch (next) {
          case "suspended":
          case "closed":
            return true;
        }
        return false;
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PendingSlaOverrideStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pending sla override ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"pending sla override"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  measuredValue(): number {
    return this.floorValue;
  }

  copy(): PendingSlaOverride {
    return new PendingSlaOverride(
      this.code,
      this.name,
      this.category,
      this.attributes,
      this.floorValue,
      this.audienceId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a pending sla override in status draft. */
export function newPendingSlaOverride(code: string, name: string): PendingSlaOverride {
  return new PendingSlaOverride(code, name, "", new Map<string, string>(), 0, "", "draft");
}
