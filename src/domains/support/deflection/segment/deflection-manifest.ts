import * as text from "../../../../kit/text.js";

/** Where a deflection manifest is in its life cycle. */
export type DeflectionManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One deflection manifest, with what the planners need to act on it. */
export class DeflectionManifest {
  code: string;
  name: string;
  utmSource: string;
  archived: boolean;
  bid: number;
  status: DeflectionManifestStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    archived: boolean,
    bid: number,
    status: DeflectionManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.archived = archived;
    this.bid = bid;
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

  canMoveTo(next: DeflectionManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done" || next === "failed";
      case "queued":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "running":
        return next === "done";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DeflectionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`deflection manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"deflection manifest"} ${this.code}`;
  }

  measuredValue(): number {
    return this.bid;
  }

  copy(): DeflectionManifest {
    return new DeflectionManifest(this.code, this.name, this.utmSource, this.archived, this.bid, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a deflection manifest in status new. */
export function newDeflectionManifest(code: string, name: string): DeflectionManifest {
  return new DeflectionManifest(code, name, "", false, 0, "new");
}
