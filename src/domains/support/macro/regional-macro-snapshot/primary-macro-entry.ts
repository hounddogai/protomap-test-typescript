import * as text from "../../../../kit/text.js";

/** Where a primary macro entry is in its life cycle. */
export type PrimaryMacroEntryStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a primary macro entry and its current status. */
export class PrimaryMacroEntry {
  code: string;
  name: string;
  revision: number;
  tags: string[];
  title: string;
  source: string;
  status: PrimaryMacroEntryStatus;

  constructor(
    code: string,
    name: string,
    revision: number,
    tags: string[],
    title: string,
    source: string,
    status: PrimaryMacroEntryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.revision = revision;
    this.tags = tags;
    this.title = title;
    this.source = source;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryMacroEntryStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryMacroEntryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary macro entry ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${"primary macro entry"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): PrimaryMacroEntry {
    return new PrimaryMacroEntry(this.code, this.name, this.revision, this.tags, this.title, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a primary macro entry in status requested. */
export function newPrimaryMacroEntry(code: string, name: string): PrimaryMacroEntry {
  return new PrimaryMacroEntry(code, name, 0, [], "", "", "requested");
}
