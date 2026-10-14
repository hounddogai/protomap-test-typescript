import * as text from "../../../../kit/text.js";

/** Where a adaptive warmup mapping is in its life cycle. */
export type AdaptiveWarmupMappingStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a adaptive warmup mapping and its current status. */
export class AdaptiveWarmupMapping {
  code: string;
  name: string;
  ceiling: number;
  title: string;
  source: string;
  status: AdaptiveWarmupMappingStatus;

  constructor(
    code: string,
    name: string,
    ceiling: number,
    title: string,
    source: string,
    status: AdaptiveWarmupMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.ceiling = ceiling;
    this.title = title;
    this.source = source;
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

  canMoveTo(next: AdaptiveWarmupMappingStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: AdaptiveWarmupMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive warmup mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.ceiling;
  }

  copy(): AdaptiveWarmupMapping {
    return new AdaptiveWarmupMapping(this.code, this.name, this.ceiling, this.title, this.source, this.status);
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a adaptive warmup mapping in status draft. */
export function newAdaptiveWarmupMapping(code: string, name: string): AdaptiveWarmupMapping {
  return new AdaptiveWarmupMapping(code, name, 0, "", "", "draft");
}
